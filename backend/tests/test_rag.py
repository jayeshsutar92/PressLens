from unittest.mock import AsyncMock, MagicMock, patch
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import AIProviderError, ConfigurationError
from app.integrations.groq_client import GroqClient
from app.schemas.rag import SourceCitation, TacticalRAGRequest, TacticalRAGResponse
from app.services.embedding_service import EmbeddingService
from app.services.knowledge_service import KnowledgeService
from app.services.rag_service import RAGService


# ---------------------------------------------------------------------------
# 1. Embedding and Similarity Tests
# ---------------------------------------------------------------------------

def test_embedding_generation_dimension_and_norm():
    """Verify generated embedding has expected dimension (384) and unit norm."""
    text = "Counter-pressing in Zone 14 with rest-defense structure"
    emb = EmbeddingService.generate_embedding(text)
    assert len(emb) == 384
    # Compute Euclidean norm (should be approximately 1.0)
    norm = sum(x * x for x in emb) ** 0.5
    assert abs(norm - 1.0) < 1e-3


def test_embedding_batch_generation():
    """Verify batch embedding generation produces vectors for all items."""
    texts = ["High press trigger", "Cover shadow blocking lane", "Low block compactness"]
    embeddings = EmbeddingService.generate_embeddings(texts)
    assert len(embeddings) == 3
    for emb in embeddings:
        assert len(emb) == 384


def test_cosine_similarity():
    """Verify mathematical behavior of cosine similarity."""
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    v_ortho = [0.0, 1.0, 0.0]
    v_opp = [-1.0, 0.0, 0.0]

    assert abs(EmbeddingService.cosine_similarity(v1, v2) - 1.0) < 1e-4
    assert abs(EmbeddingService.cosine_similarity(v1, v_ortho) - 0.0) < 1e-4
    assert abs(EmbeddingService.cosine_similarity(v1, v_opp) - (-1.0)) < 1e-4


def test_document_chunking():
    """Verify document chunker extracts structured sections."""
    chunks = EmbeddingService.chunk_document_content(
        title="High Press",
        topic="high_pressing",
        summary="Funneling opponent into touchline trap.",
        content="First paragraph with deep detail.\n\nSecond paragraph covering fullback isolation.",
        tactical_principles=["Force play wide.", "Step up backline."],
    )
    assert len(chunks) >= 3
    assert any("Summary:" in c for c in chunks)
    assert any("Tactical Principles" in c for c in chunks)


# ---------------------------------------------------------------------------
# 2. Vector Retrieval and Semantic Search Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_semantic_search_chunks(db_session: AsyncSession):
    """Verify semantic search retrieves and ranks relevant tactical chunks from PostgreSQL."""
    query = "gegenpressing 5-second transition rule"
    results = await KnowledgeService.semantic_search_chunks(
        db=db_session,
        query_text=query,
        top_k=3,
        min_similarity=0.1,
    )
    assert len(results) >= 1
    chunk, score = results[0]
    assert score > 0.1
    assert chunk.content is not None
    assert len(chunk.embedding) == 384


@pytest.mark.asyncio
async def test_semantic_search_empty_results(db_session: AsyncSession):
    """Verify semantic search handles impossible thresholds gracefully by returning empty list."""
    results = await KnowledgeService.semantic_search_chunks(
        db=db_session,
        query_text="completely unrelated random gibberish query 998877",
        top_k=3,
        min_similarity=0.9999,  # Unattainable threshold
    )
    assert results == []


# ---------------------------------------------------------------------------
# 3. Prompt Construction & Grounding Tests
# ---------------------------------------------------------------------------

def test_prompt_construction_grounding():
    """Verify system instructions ground prompt in theory and forbid hallucinations."""
    mock_chunk = MagicMock()
    mock_chunk.content = "Compactness requires less than 30m vertical distance."
    mock_chunk.chunk_metadata = {"source_title": "Italian FA Defensive Manual"}

    messages = RAGService._construct_grounded_prompt(
        query="How to keep mid block compact?",
        scenario=None,
        retrieved_chunks=[(mock_chunk, 0.88)],
    )

    assert len(messages) == 2
    system_msg = messages[0]["content"]
    user_msg = messages[1]["content"]

    assert "PressLens AI" in system_msg
    assert "Ground all tactical explanations in the provided Theoretical Knowledge Chunks" in system_msg
    assert "Italian FA Defensive Manual" in user_msg
    assert "Compactness requires less than 30m" in user_msg


# ---------------------------------------------------------------------------
# 4. Groq Integration & Structured Response Handling Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_groq_mocked_structured_completion():
    """Verify Groq client parses valid structured responses cleanly."""
    mock_raw_response = {
        "query": "How to press a 4-2-3-1?",
        "scenario_title": "4-3-3 High Press",
        "tactical_analysis": "The 4-3-3 provides natural wing overloads against 4-2-3-1 pivots.",
        "pressing_scheme_evaluation": "Effective when winger blocks pass to fullback.",
        "recommended_actions": ["Trap along right touchline."],
        "key_risks": ["Vulnerable to quick switch."],
        "sources_cited": [],
        "retrieved_chunks_count": 2,
        "confidence_score": 0.92,
    }

    with patch.object(GroqClient, "chat_completion", new_callable=AsyncMock) as mock_complete:
        import json
        mock_complete.return_value = json.dumps(mock_raw_response)

        result = await GroqClient.chat_completion_structured(
            messages=[{"role": "user", "content": "test"}],
            schema_class=TacticalRAGResponse,
        )

        assert isinstance(result, TacticalRAGResponse)
        assert result.confidence_score == 0.92
        assert "4-3-3 provides natural wing overloads" in result.tactical_analysis


@pytest.mark.asyncio
async def test_groq_client_missing_key_raises_configuration_error():
    """Verify Groq client raises ConfigurationError when API key is unconfigured."""
    with patch("app.integrations.groq_client.settings.GROQ_API_KEY", ""):
        # Reset cached client
        import app.integrations.groq_client as gc
        gc._groq_async_client = None

        with pytest.raises(ConfigurationError):
            gc.get_groq_client()


# ---------------------------------------------------------------------------
# 5. Full RAG Pipeline & API Endpoint Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rag_service_fallback_on_llm_failure(db_session: AsyncSession):
    """Verify RAGService produces grounded theoretical fallback when LLM fails or is unconfigured."""
    request = TacticalRAGRequest(
        query="Explain pressing trap mechanics along the sideline",
        top_k=2,
    )

    with patch.object(GroqClient, "chat_completion_structured", side_effect=AIProviderError("Service Down")):
        response = await RAGService.analyze_tactical_query(db_session, request)

        assert isinstance(response, TacticalRAGResponse)
        assert response.query == request.query
        assert len(response.recommended_actions) > 0
        assert len(response.key_risks) > 0
        assert response.confidence_score > 0.0


@pytest.mark.asyncio
async def test_tactical_rag_api_endpoint(async_client: AsyncClient):
    """Verify POST /api/v1/analysis/tactical-rag executes cleanly via HTTP."""
    # First get a prepared scenario ID
    sc_res = await async_client.get("/api/v1/scenarios")
    scenario_id = sc_res.json()[0]["id"]

    payload = {
        "query": "How should our center forward curve their run to initiate the pressing trap?",
        "scenario_id": scenario_id,
        "top_k": 3,
    }

    response = await async_client.post("/api/v1/analysis/tactical-rag", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["query"] == payload["query"]
    assert data["scenario_title"] is not None
    assert "tactical_analysis" in data
    assert "pressing_scheme_evaluation" in data
    assert len(data["recommended_actions"]) > 0
    assert len(data["sources_cited"]) > 0
    assert data["retrieved_chunks_count"] >= 1
    assert data["confidence_score"] > 0.0

