import json
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "College ERP API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "college-erp-super-secret-production-quality-jwt-signing-key-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database Configuration & Cloud Connection Pooling
    DATABASE_URL: str = "sqlite:///./college_erp.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    DB_ECHO: bool = False

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Ensure standard PostgreSQL URLs use psycopg2 driver for SQLAlchemy 2.0 compatibility."""
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("postgres://"):
                return v_trimmed.replace("postgres://", "postgresql+psycopg2://", 1)
            elif v_trimmed.startswith("postgresql://") and not v_trimmed.startswith("postgresql+"):
                return v_trimmed.replace("postgresql://", "postgresql+psycopg2://", 1)
            return v_trimmed
        return v

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Initial Superadmin
    FIRST_SUPERADMIN_EMAIL: str = "shivam@quantum.edu"
    FIRST_SUPERADMIN_USERNAME: str = "shivam"
    FIRST_SUPERADMIN_PASSWORD: str = "shivam@123"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
