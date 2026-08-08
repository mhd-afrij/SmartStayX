from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017/SmartStayX"
    ai_model: str = "openai/gpt-4o-mini"
    openai_api_key: str = ""
    ai_host: str = "127.0.0.1"
    ai_port: int = 8001

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
