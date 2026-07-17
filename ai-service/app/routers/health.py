from fastapi import APIRouter
from app.config import settings
from app.database import is_db_available

router = APIRouter(tags=["health"])


@router.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "SmartStayX AI Microservice",
        "provider": "openrouter",
        "model": settings.ai_model,
        "database": "connected" if is_db_available() else "unavailable",
    }
