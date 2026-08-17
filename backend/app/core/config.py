from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "نظام إدارة المقاولات المتكامل"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database Settings
    DATABASE_URL: str = "sqlite+aiosqlite:///./qb_dev.db"

    # JWT & Security Settings
    SECRET_KEY: str = "SUPER_SECRET_KEY_CHANGE_THIS_IN_PRODUCTION_QB_2026_SECURE_TOKEN"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # CORS
    ALLOWED_ORIGINS: str = (
    "http://localhost:5173,http://localhost:3000,http://localhost:3001,http://localhost:3002"
    ",http://localhost:3003,http://localhost:3004,http://localhost:3005,http://localhost:3006,http://localhost:3007"
    ",http://127.0.0.1:5173,http://127.0.0.1:3000,http://127.0.0.1:3001"
    ",http://localhost:8080,http://192.168.1.1:3000,http://192.168.1.1:3001"
)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def _validate_secret_key(self):
        if self.ENVIRONMENT == "production" and (
            not self.SECRET_KEY
            or "CHANGE_IN_PRODUCTION" in self.SECRET_KEY
            or "SUPER_SECRET_KEY" in self.SECRET_KEY
        ):
            raise RuntimeError(
                "SECRET_KEY must be set to a strong random value via environment variable in production"
            )
        return self

settings = Settings()
