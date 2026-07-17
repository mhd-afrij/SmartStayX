from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import connect_db, close_db, is_db_available
from app.routers import chat, trip_planner, health


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(trip_planner.router)
app.include_router(health.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.ai_host,
        port=settings.ai_port,
        reload=True,
    )
