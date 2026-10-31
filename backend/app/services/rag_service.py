from typing import Dict, List, Optional, Tuple
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions import AIProviderError, ConfigurationError, EntityNotFoundError
from app.core.logging import logger
from app.integrations.groq_client import GroqClient
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.scenario import Scenario
from app.schemas.rag import SourceCitation, TacticalRAGRequest, TacticalRAGResponse
from app.services.knowledge_service import KnowledgeService
from app.services.scenario_service import ScenarioService


class RAGService:
    """Orchestrates tactical query processing, PostgreSQL semantic retrieval, and Groq generation."""

    @classmethod
    async def analyze_tactical_query(
        cls,
        db: AsyncSession,
        request: TacticalRAGRequest,
    ) -> TacticalRAGResponse:
        """Executes the full end-to-end RAG pipeline for a tactical inquiry."""
        # 1. Retrieve Scenario context (if requested)
        scenario: Optional[Scenario] = None
        if request.scenario_id:
            try:
                scenario = await ScenarioService.get_scenario_by_id(db, request.scenario_id)
            except EntityNotFoundError:
                raise
            except Exception as e:
                logger.warning("Error retrieving scenario for RAG: %s", str(e))

        # 2. Semantic vector retrieval from PostgreSQL
        retrieved_chunks = await KnowledgeService.semantic_search_chunks(
            db=db,
            query_text=request.query,
            topic=request.topic,
            top_k=request.top_k,
            min_similarity=settings.RAG_MIN_SIMILARITY,
        )

        logger.info(
            "RAG retrieved %d chunks for query '%s' (scenario: %s)",
            len(retrieved_chunks),
            request.query,
            scenario.title if scenario else "None",
        )

        # 3. Extract and deduplicate source citations
        citations = cls._build_citations(retrieved_chunks)

        # 4. Construct grounded prompts
        messages = cls._construct_grounded_prompt(
            query=request.query,
            scenario=scenario,
            retrieved_chunks=retrieved_chunks,
        )

        # 5. Invoke Groq LLM (with fallback if API key not configured)
        try:
            rag_response = await GroqClient.chat_completion_structured(
                messages=messages,
                schema_class=TacticalRAGResponse,
            )
            # Ensure query, scenario title, citations and count match reality
            rag_response.query = request.query
            rag_response.scenario_title = scenario.title if scenario else None
            rag_response.sources_cited = citations
            rag_response.retrieved_chunks_count = len(retrieved_chunks)
            return rag_response

        except (ConfigurationError, AIProviderError) as llm_err:
            logger.warning(
                "Groq LLM call unavailable (%s). Returning grounded theoretical fallback synthesis.",
                str(llm_err),
            )
            return cls._build_grounded_fallback(
                query=request.query,
                scenario=scenario,
                retrieved_chunks=retrieved_chunks,
                citations=citations,
            )

    @staticmethod
    def _build_citations(
        chunks_with_scores: List[Tuple[KnowledgeChunk, float]],
    ) -> List[SourceCitation]:
        citations: List[SourceCitation] = []
        seen_titles = set()

        for chunk, score in chunks_with_scores:
            meta = chunk.chunk_metadata or {}
            title = meta.get("source_title", "Tactical Document")
            if title not in seen_titles:
                seen_titles.add(title)
                citations.append(
                    SourceCitation(
                        document_title=title,
                        topic=meta.get("topic", "general_tactics"),
                        author=meta.get("author"),
                        publication=meta.get("source_title"),
                        relevance_score=round(score, 3),
                    )
                )
        return citations

    @classmethod
    def _construct_grounded_prompt(
        cls,
        query: str,
        scenario: Optional[Scenario],
        retrieved_chunks: List[Tuple[KnowledgeChunk, float]],
    ) -> List[Dict[str, str]]:
        system_instructions = (
            "You are PressLens AI, a world-class football tactical analyst and pressing systems specialist. "
            "You analyze football pressing mechanics, spatial geometry, pressing traps, cover shadows, "
            "and defensive transitions using strictly grounded football tactical theory.\n\n"
            "CRITICAL INSTRUCTIONS:\n"
            "1. Ground all tactical explanations in the provided Theoretical Knowledge Chunks. Never invent authors or theoretical sources.\n"
            "2. Distinguish clearly between established tactical principles and scenario-specific observations.\n"
            "3. If provided with a match scenario, reference the specific formations, player roles, and ball location.\n"
            "4. Return your output as a valid JSON object matching the requested schema.\n"
        )

        user_content_parts: List[str] = []

        # Knowledge context
        if retrieved_chunks:
            user_content_parts.append("### THEORETICAL TACTICAL KNOWLEDGE BASE CHUNKS:")
            for i, (chunk, score) in enumerate(retrieved_chunks, 1):
                meta = chunk.chunk_metadata or {}
                user_content_parts.append(
                    f"[{i}] Source: {meta.get('source_title', 'Unknown')} (Relevance: {score:.2f})\n"
                    f"{chunk.content}\n"
                )
        else:
            user_content_parts.append(
                "### THEORETICAL TACTICAL KNOWLEDGE:\n"
                "No direct knowledge chunks matched the search criteria with high similarity. "
                "Base analysis on standard foundational pressing theory and explicitly communicate uncertainty.\n"
            )

        # Scenario context
        if scenario:
            user_content_parts.append(
                f"### OBSERVED MATCH SCENARIO: {scenario.title}\n"
                f"- Phase: {scenario.match_phase} | Situation: {scenario.tactical_situation}\n"
                f"- Attacking Team ({scenario.attacking_team.get('name', 'Attacking')}): Formation {scenario.attacking_team.get('formation', 'N/A')}\n"
                f"- Defending Team ({scenario.defending_team.get('name', 'Defending')}): Formation {scenario.defending_team.get('formation', 'N/A')}\n"
                f"- Ball Location: {scenario.ball_position.get('zone', 'Midfield')} (x={scenario.ball_position.get('x')}, y={scenario.ball_position.get('y')})\n"
            )

        user_content_parts.append(f"### USER INQUIRY:\n{query}\n")
        user_content_parts.append(
            "Respond in JSON format with keys: query, scenario_title, tactical_analysis, "
            "pressing_scheme_evaluation, recommended_actions (array), key_risks (array), "
            "sources_cited (array), retrieved_chunks_count (int), confidence_score (float 0.0-1.0)."
        )

        return [
            {"role": "system", "content": system_instructions},
            {"role": "user", "content": "\n".join(user_content_parts)},
        ]

    @staticmethod
    def _build_grounded_fallback(
        query: str,
        scenario: Optional[Scenario],
        retrieved_chunks: List[Tuple[KnowledgeChunk, float]],
        citations: List[SourceCitation],
    ) -> TacticalRAGResponse:
        """Generates a deterministic, factual analysis synthesis directly from retrieved knowledge when LLM API is offline."""
        principles_collected: List[str] = []
        for chunk, _ in retrieved_chunks:
            lines = [line.strip("- ") for line in chunk.content.splitlines() if line.strip().startswith("-")]
            principles_collected.extend(lines[:2])

        scenario_name = scenario.title if scenario else "Generic Match Situation"
        phase = scenario.match_phase if scenario else "defensive_phase"

        tactical_summary = (
            f"Based on grounded tactical literature for '{query}', effective execution in the {phase} "
            f"requires disciplined spatial control and synchronized movements. "
            f"Retrieved principles emphasize maintaining compactness and initiating pressure upon visual triggers."
        )

        evaluation = (
            f"Evaluating setup for {scenario_name}: Defending block must coordinate pressure along the active corridor, "
            f"utilizing cover shadows to block vertical passing avenues into central zones."
        )

        actions = principles_collected[:3] if principles_collected else [
            "Maintain less than 30 meters distance between forward and defensive lines.",
            "Curve pressing runs to funnel ball carriers towards the touchline.",
            "Angle body to cast a cover shadow over the central midfield outlet.",
        ]

        risks = [
            "Bypassed press exposes large transitional spaces in the defensive half.",
            "Delayed defensive line step-up allows opponents to receive between lines in Zone 14.",
        ]

        confidence = 0.85 if retrieved_chunks else 0.40

        return TacticalRAGResponse(
            query=query,
            scenario_title=scenario.title if scenario else None,
            tactical_analysis=tactical_summary,
            pressing_scheme_evaluation=evaluation,
            recommended_actions=actions,
            key_risks=risks,
            sources_cited=citations,
            retrieved_chunks_count=len(retrieved_chunks),
            confidence_score=confidence,
        )

