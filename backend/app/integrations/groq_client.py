import asyncio
import json
import random
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError
from app.core.config import settings
from app.core.exceptions import AIProviderError, ConfigurationError
from app.core.logging import logger

T = TypeVar("T", bound=BaseModel)

# Lazy client instance
_groq_async_client = None


def get_groq_client():
    """Lazily initializes the asynchronous Groq client."""
    global _groq_async_client
    if _groq_async_client is None:
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.startswith("your_"):
            raise ConfigurationError(
                "GROQ_API_KEY is not configured. Please set a valid key in your environment or .env file."
            )
        try:
            from groq import AsyncGroq
            _groq_async_client = AsyncGroq(
                api_key=settings.GROQ_API_KEY,
                timeout=settings.GROQ_TIMEOUT_SECONDS,
            )
        except Exception as err:
            raise AIProviderError(f"Failed to initialize Groq client: {str(err)}")
    return _groq_async_client


class GroqClient:
    """Centralized, resilient wrapper for Groq LLM API interactions."""

    @classmethod
    async def chat_completion(
        cls,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
        response_format: Optional[Dict[str, str]] = None,
    ) -> str:
        """Executes a chat completion call with timeout handling and exponential backoff retries."""
        client = get_groq_client()
        target_model = model or settings.GROQ_MODEL
        max_retries = settings.GROQ_MAX_RETRIES

        delay = 1.0
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(
                    "Sending prompt to Groq model '%s' (attempt %d/%d)...",
                    target_model,
                    attempt,
                    max_retries,
                )

                response = await asyncio.wait_for(
                    client.chat.completions.create(
                        model=target_model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        response_format=response_format,
                    ),
                    timeout=settings.GROQ_TIMEOUT_SECONDS,
                )

                content = response.choices[0].message.content
                if not content:
                    raise AIProviderError("Groq returned an empty completion response")

                logger.info("Groq completion received successfully (%d characters).", len(content))
                return content

            except asyncio.TimeoutError:
                logger.warning("Groq request timed out on attempt %d/%d.", attempt, max_retries)
                if attempt == max_retries:
                    raise AIProviderError("Groq request timed out after multiple attempts.", status_code=504)

            except Exception as e:
                err_str = str(e)
                # Check for rate limiting (429) or transient provider errors
                is_rate_limit = "429" in err_str or "rate limit" in err_str.lower()
                is_server_error = "500" in err_str or "503" in err_str or "overloaded" in err_str.lower()

                if (is_rate_limit or is_server_error) and attempt < max_retries:
                    # Exponential backoff with jitter
                    jitter = random.uniform(0.1, 0.5)
                    sleep_time = (delay * (2 ** (attempt - 1))) + jitter
                    logger.warning(
                        "Groq transient error on attempt %d: %s. Retrying in %.2fs...",
                        attempt,
                        err_str,
                        sleep_time,
                    )
                    await asyncio.sleep(sleep_time)
                else:
                    logger.error("Groq API error on attempt %d/%d: %s", attempt, max_retries, err_str)
                    raise AIProviderError(f"Groq API error: {err_str}")

        raise AIProviderError("Groq request failed after all retry attempts.")

    @classmethod
    async def chat_completion_structured(
        cls,
        messages: List[Dict[str, str]],
        schema_class: Type[T],
        model: Optional[str] = None,
        temperature: float = 0.1,
    ) -> T:
        """Executes a completion enforcing JSON object structure and validating against a Pydantic model."""
        raw_json_str = await cls.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            response_format={"type": "json_object"},
        )

        try:
            parsed_dict = json.loads(raw_json_str)
            return schema_class.model_validate(parsed_dict)
        except json.JSONDecodeError as json_err:
            logger.error("Failed to parse Groq JSON response: %s", str(json_err))
            raise AIProviderError(f"Malformed JSON response from Groq: {str(json_err)}")
        except ValidationError as val_err:
            logger.error("Groq JSON failed schema validation: %s", str(val_err))
            raise AIProviderError(f"Groq response did not adhere to expected schema: {str(val_err)}")
