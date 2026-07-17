from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient | None = None
db = None
db_available = False


async def connect_db():
    global client, db, db_available
    client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    db = client["SmartStayX"]

    try:
        await db.command("ping")
        await db.conversations.create_index("userId")
        await db.conversations.create_index("updatedAt")
        await db.messages.create_index("conversationId")
        await db.messages.create_index([("conversationId", 1), ("createdAt", 1)])
        db_available = True
    except Exception:
        db_available = False
        raise


async def close_db():
    global client, db_available, db
    if client:
        client.close()
    client = None
    db = None
    db_available = False


def get_db():
    return db


def is_db_available():
    return db_available
