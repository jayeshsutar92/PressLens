from functools import lru_cache
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_env_files = (
    str(Path(__file__).resolve().parent.parent.parent / ".env"),
    ".env",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_files,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    PROJECT_NAME: str = "PressLens API"
    VERSION: str = "0.2.0"
    DESCRIPTION: str = "AI-powered football tactical analysis with PostgreSQL RAG and Groq LLM integration"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # PostgreSQL Database URL
    DATABASE_URL: str

    # CORS configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # Groq LLM Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_TIMEOUT_SECONDS: float = 30.0
    GROQ_MAX_RETRIES: int = 3

    # Embedding & Vector Retrieval Configuration
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMENSION: int = 384
    RAG_TOP_K: int = 4
    RAG_MIN_SIMILARITY: float = 0.30

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://localhost:3000"]

    @property
    def sync_database_url(self) -> str:
        """Returns standard synchronous psycopg2/postgresql database URL for Alembic migrations."""
        if self.DATABASE_URL.startswith("postgresql+asyncpg://"):
            return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
        return self.DATABASE_URL


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
