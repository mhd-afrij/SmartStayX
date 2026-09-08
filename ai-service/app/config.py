from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017/SmartStayX"
    ai_model: str = "openai/gpt-4o-mini"
    openai_api_key: str = ""
    ai_host: str = "127.0.0.1"
    ai_port: int = 8001
    # Shared secret that the backend must send as `x-internal-token`.
    # Requests without it are rejected (503 until configured, then 401).
    internal_token: str = Field(default="", alias="AI_INTERNAL_TOKEN")

    model_config = {"env_file": ".env", "extra": "ignore", "populate_by_name": True}


settings = Settings()
