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

    # Seed: default demo users/entities (admin@qb.com ...) — OFF in production
    SEED_DEFAULT_USERS: bool = True

    # Login security: rate limit (per IP) + account lockout (per user)
    LOGIN_RATE_LIMIT_ATTEMPTS: int = 5
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 60
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    # Hosts allowed to reach the API (comma-separated; "*" = any in dev)
    TRUSTED_HOSTS: str = "*"

    # Email (SMTP) — used for account activation & password reset links.
    # When SMTP_HOST is empty, emails are logged to console instead (dev mode).
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "QB System <no-reply@qb-system.com>"
    SMTP_USE_TLS: bool = True

    # Public app URL used inside email links
    FRONTEND_URL: str = "http://localhost:5173"

    # Email token expiry
    EMAIL_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

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
