import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from pydantic import BaseModel, Field
from app.core.exceptions import AIProviderError
from app.integrations.groq_client import GroqClient


class SampleTacticalModel(BaseModel):
    pressing_intensity: str = Field(...)
    key_player: str = Field(...)


@pytest.mark.asyncio
async def test_groq_timeout_handling_raises_504():
    """GroqClient should raise AIProviderError with status 504 when requests repeatedly time out."""
    mock_client = MagicMock()
    # Simulate timeout on create call
    mock_client.chat.completions.create = AsyncMock(side_effect=asyncio.TimeoutError())

    with patch("app.integrations.groq_client.get_groq_client", return_value=mock_client):
        with pytest.raises(AIProviderError) as exc_info:
            await GroqClient.chat_completion(
                messages=[{"role": "user", "content": "analyze"}],
            )

        assert exc_info.value.status_code == 504
        assert "timed out" in exc_info.value.message.lower()


@pytest.mark.asyncio
async def test_groq_rate_limit_retry_success():
    """GroqClient should retry upon receiving a 429 rate limit error and succeed when next attempt passes."""
    mock_success_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = '{"pressing_intensity": "High", "key_player": "Salah"}'
    mock_success_response.choices = [mock_choice]

    mock_client = MagicMock()
    # Fail first with 429 rate limit, succeed on second attempt
    mock_client.chat.completions.create = AsyncMock(
        side_effect=[
            Exception("Error code: 429 - Rate limit reached for model"),
            mock_success_response,
        ]
    )

    with patch("app.integrations.groq_client.get_groq_client", return_value=mock_client):
        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            result = await GroqClient.chat_completion(
                messages=[{"role": "user", "content": "test"}],
            )
            assert result == '{"pressing_intensity": "High", "key_player": "Salah"}'
            assert mock_client.chat.completions.create.call_count == 2
            mock_sleep.assert_awaited_once()


@pytest.mark.asyncio
async def test_groq_empty_response_raises_ai_provider_error():
    """GroqClient should raise AIProviderError when Groq returns an empty message body."""
    mock_empty_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = ""
    mock_empty_response.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_empty_response)

    with patch("app.integrations.groq_client.get_groq_client", return_value=mock_client):
        with pytest.raises(AIProviderError) as exc_info:
            await GroqClient.chat_completion(
                messages=[{"role": "user", "content": "test"}],
            )
        assert "empty completion" in exc_info.value.message.lower()


@pytest.mark.asyncio
async def test_groq_structured_completion_malformed_json_raises_ai_provider_error():
    """GroqClient.chat_completion_structured should raise AIProviderError on invalid JSON."""
    with patch.object(GroqClient, "chat_completion", AsyncMock(return_value="INVALID_NON_JSON_CONTENT")):
        with pytest.raises(AIProviderError) as exc_info:
            await GroqClient.chat_completion_structured(
                messages=[{"role": "user", "content": "test"}],
                schema_class=SampleTacticalModel,
            )
        assert "malformed json" in exc_info.value.message.lower()


@pytest.mark.asyncio
async def test_groq_structured_completion_schema_mismatch_raises_ai_provider_error():
    """GroqClient.chat_completion_structured should raise AIProviderError when required fields are missing."""
    invalid_payload = '{"pressing_intensity": "High"}'  # missing key_player
    with patch.object(GroqClient, "chat_completion", AsyncMock(return_value=invalid_payload)):
        with pytest.raises(AIProviderError) as exc_info:
            await GroqClient.chat_completion_structured(
                messages=[{"role": "user", "content": "test"}],
                schema_class=SampleTacticalModel,
            )
        assert "schema" in exc_info.value.message.lower()

