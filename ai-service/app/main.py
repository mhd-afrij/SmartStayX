from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.config import settings
from app.database import connect_db, close_db, is_db_available
from app.middleware.auth import InternalAuthMiddleware
from app.routers import chat, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_db()
    except Exception as exc:
        app.state.db_error = str(exc)
        app.state.db_available = False
    else:
        app.state.db_available = is_db_available()
    yield
    await close_db()


app = FastAPI(
    title="SmartStayX AI Microservice",
    description="AI-powered chatbot, trip planner, and recommendation engine for SmartStayX",
    version="1.0.0",
    lifespan=lifespan,
)

# The AI service is an internal component reached only by the Node backend,
# which handles browser CORS. Requests must prove knowledge of AI_INTERNAL_TOKEN.
app.add_middleware(InternalAuthMiddleware, settings=settings)

app.include_router(chat.router)
app.include_router(health.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.ai_host,
        port=settings.ai_port,
        reload=True,
    )
