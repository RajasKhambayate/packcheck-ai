"""
Central configuration for PackCheck AI backend.

All values can be overridden via environment variables / .env file so the
app is deployable without touching code (12-factor style).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "PackCheck AI"
    ENV: str = "development"

    # Falls back to a local SQLite file so the project runs with ZERO setup.
    # For production point this at Postgres, e.g.:
    # postgresql+psycopg2://user:password@host:5432/packcheck
    DATABASE_URL: str = "sqlite:///./packcheck.db"

    SECRET_KEY: str = "change-this-secret-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    UPLOAD_DIR: str = "app/static/uploads"
    REPORT_DIR: str = "app/static/reports"

    CORS_ORIGINS: str = "*"

    # Simplified font-size compliance thresholds (relative to image height),
    # used because pixel->mm calibration needs a reference object in the
    # frame in a production deployment. Documented in README.
    MIN_DECLARATION_HEIGHT_RATIO: float = 0.012

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
