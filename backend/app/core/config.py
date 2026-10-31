from functools import lru_cache
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    PROJECT_NAME: str = "PressLens API"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "AI-powered football tactical analysis backend foundation"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # PostgreSQL Database URL (e.g. postgresql+asyncpg://user:pass@localhost:5432/presslens)
    DATABASE_URL: str

    # CORS origins allowed to communicate with API
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

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
