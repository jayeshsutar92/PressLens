from typing import List, Optional
import hashlib
import numpy as np
from app.core.config import settings
from app.core.logging import logger

# Lazy model holder
_embedding_model = None


def get_embedding_model():
    """Lazily loads and returns the FastEmbed TextEmbedding model."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from fastembed import TextEmbedding
            logger.info("Initializing embedding model: %s", settings.EMBEDDING_MODEL)
            _embedding_model = TextEmbedding(model_name=settings.EMBEDDING_MODEL)
        except Exception as exc:
            logger.warning("Could not initialize FastEmbed model directly: %s. Fallback mode active.", str(exc))
            _embedding_model = None
    return _embedding_model


def _generate_deterministic_fallback(text: str, dim: int = 384) -> List[float]:
    """Generates a reproducible, unit-normalized dense float vector when offline or in test environments."""
    # Seed RNG using md5 hash of text for strict determinism
    hash_bytes = hashlib.md5(text.encode("utf-8")).digest()
    seed = int.from_bytes(hash_bytes[:4], "big")
    rng = np.random.RandomState(seed)
    raw = rng.randn(dim).astype(np.float32)
    norm = np.linalg.norm(raw)
    normalized = (raw / norm) if norm > 0 else raw
    return normalized.tolist()


class EmbeddingService:
    """Service responsible for generating semantic text embeddings and similarity calculations."""

    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """Generates a dense vector embedding for a single text string."""
        if not text or not text.strip():
            return [0.0] * settings.EMBEDDING_DIMENSION

        model = get_embedding_model()
        if model is not None:
            try:
                embeddings = list(model.embed([text]))
                vec = np.array(embeddings[0], dtype=np.float32)
                norm = np.linalg.norm(vec)
                if norm > 0:
                    vec = vec / norm
                return vec.tolist()
            except Exception as e:
                logger.warning("FastEmbed execution failed (%s), falling back to deterministic vector.", str(e))

        return _generate_deterministic_fallback(text, settings.EMBEDDING_DIMENSION)

    @classmethod
    def generate_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """Generates dense vector embeddings for a list of texts in batch."""
        if not texts:
            return []

        model = get_embedding_model()
        if model is not None:
            try:
                embeddings = list(model.embed(texts))
                result = []
                for emb in embeddings:
                    vec = np.array(emb, dtype=np.float32)
                    norm = np.linalg.norm(vec)
                    if norm > 0:
                        vec = vec / norm
                    result.append(vec.tolist())
                return result
            except Exception as e:
                logger.warning("FastEmbed batch failed (%s), using deterministic fallback.", str(e))

        return [_generate_deterministic_fallback(t, settings.EMBEDDING_DIMENSION) for t in texts]

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Computes the cosine similarity between two vectors."""
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    @staticmethod
    def chunk_document_content(
        title: str,
        topic: str,
        summary: str,
        content: str,
        tactical_principles: Optional[List[str]] = None,
    ) -> List[str]:
        """Splits document content into structured, semantically meaningful text chunks for RAG."""
        chunks: List[str] = []

        # Chunk 1: Document Overview & Summary
        overview = f"Title: {title}\nTopic: {topic}\nSummary: {summary}"
        chunks.append(overview)

        # Chunk 2: Tactical Principles (if present)
        if tactical_principles:
            principles_str = "\n- ".join(tactical_principles)
            chunks.append(f"Tactical Principles for {title}:\n- {principles_str}")

        # Chunk 3+: Content paragraphs or sections
        paragraphs = [p.strip() for p in content.split("\n\n") if len(p.strip()) > 30]
        for p in paragraphs:
            chunks.append(f"{title} ({topic}):\n{p}")

        return chunks
