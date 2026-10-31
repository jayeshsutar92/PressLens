import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_tactical_topics(async_client: AsyncClient):
    """Verify topic summary endpoint returns core football tactical concepts."""
    response = await async_client.get("/api/v1/knowledge/topics")
    assert response.status_code == 200
    topics = response.json()
    assert isinstance(topics, list)
    assert len(topics) >= 8

    topic_keys = [t["topic"] for t in topics]
    assert "high_pressing" in topic_keys
    assert "counter_pressing" in topic_keys
    assert "pressing_triggers" in topic_keys
    assert "cover_shadows" in topic_keys
    assert "defensive_compactness" in topic_keys
    assert "pressing_traps" in topic_keys
    assert "passing_lane_coverage" in topic_keys
    assert "defensive_transitions" in topic_keys


@pytest.mark.asyncio
async def test_list_knowledge_documents_and_filter(async_client: AsyncClient):
    """Verify listing knowledge documents and filtering by topic."""
    # List all
    all_res = await async_client.get("/api/v1/knowledge")
    assert all_res.status_code == 200
    all_docs = all_res.json()
    assert len(all_docs) >= 8

    # Filter by topic
    filter_res = await async_client.get("/api/v1/knowledge?topic=counter_pressing")
    assert filter_res.status_code == 200
    filtered_docs = filter_res.json()
    assert len(filtered_docs) >= 1
    for doc in filtered_docs:
        assert doc["topic"] == "counter_pressing"


@pytest.mark.asyncio
async def test_search_knowledge_by_keyword(async_client: AsyncClient):
    """Verify searching knowledge base using keywords."""
    # Search for Gegenpressing
    search_res = await async_client.get("/api/v1/knowledge/search?q=Gegenpressing")
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) >= 1
    assert any("counter_pressing" == doc["topic"] for doc in results)

    # Search for cover shadow
    shadow_res = await async_client.get("/api/v1/knowledge/search?q=shadow")
    assert shadow_res.status_code == 200
    shadow_results = shadow_res.json()
    assert len(shadow_results) >= 1
    assert any("cover_shadows" == doc["topic"] for doc in shadow_results)


@pytest.mark.asyncio
async def test_get_knowledge_document_by_id(async_client: AsyncClient):
    """Verify retrieving specific knowledge document with source attribution."""
    list_res = await async_client.get("/api/v1/knowledge")
    doc_id = list_res.json()[0]["id"]

    response = await async_client.get(f"/api/v1/knowledge/{doc_id}")
    assert response.status_code == 200
    doc = response.json()
    assert doc["id"] == doc_id
    assert "tactical_principles" in doc
    assert isinstance(doc["tactical_principles"], list)
    assert "source_metadata" in doc
    assert "author" in doc["source_metadata"]
    assert "publication" in doc["source_metadata"]


@pytest.mark.asyncio
async def test_create_custom_knowledge_document(async_client: AsyncClient):
    """Verify creating a custom verified tactical knowledge document."""
    payload = {
        "title": "Half-Space Overload Defense",
        "topic": "half_space_defense",
        "category": "spatial_control",
        "summary": "Tactical methods to neutralize inverted wingers and underlapping fullbacks in the half-space.",
        "content": "Defending the half-space requires the ball-side central midfielder to drop diagonally while the fullback narrows their stance...",
        "tactical_principles": [
            "Force play outward towards the touchline.",
            "Maintain body orientation at 45 degrees.",
        ],
        "source_metadata": {
            "author": "PressLens Tactical Analytics",
            "publication": "PressLens Research Notes",
            "year": 2026,
            "title": "Half-Space Compression Models",
            "verification_status": "verified",
        },
        "tags": ["half_space", "spatial_control", "underlap"],
    }

    create_res = await async_client.post("/api/v1/knowledge", json=payload)
    assert create_res.status_code == 201
    created_doc = create_res.json()
    assert created_doc["title"] == payload["title"]
    assert created_doc["topic"] == "half_space_defense"
    assert "id" in created_doc

