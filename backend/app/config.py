import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "EventSphere API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./eventsphere.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    CORS_ORIGINS: list[str] = ["*"]  # Allow all for development

    # Mock settings
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")

    class Config:
        env_file = ".env"

settings = Settings()
