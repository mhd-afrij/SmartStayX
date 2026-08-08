from fastapi import APIRouter, HTTPException, Header, Depends
from sse_starlette.sse import EventSourceResponse
from app.database import get_db, is_db_available
from app.models.chat import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    ConversationDetail,
    Message,
    MessageRole,
)
from app.services.llm_service import generate_response, generate_streaming_response
from app.services.context_service import get_user_context, get_hotel_context
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from typing import Optional
import json

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _parse_object_id(value: str) -> ObjectId:
    """Convert a string to an ObjectId, returning a 400 on malformed input."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid conversation id")


def _serialize_conversation(conv) -> ConversationResponse:
    preview = ""
    if "messages" in conv and conv["messages"]:
        last = conv["messages"][-1]
        preview = (last.get("content", "") or "")[:80]
    return ConversationResponse(
        id=str(conv["_id"]),
        title=conv.get("title", "New conversation"),
        preview=preview,
        createdAt=conv.get("createdAt", datetime.utcnow()),
        updatedAt=conv.get("updatedAt", datetime.utcnow()),
    )


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(user_id: Optional[str] = Header(None)):
    if not is_db_available():
        raise HTTPException(status_code=503, detail="Conversation storage is unavailable")
    db = get_db()
    conv = {
        "userId": user_id or "anonymous",
        "title": "New conversation",
        "messages": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.conversations.insert_one(conv)
    conv["_id"] = result.inserted_id
    return _serialize_conversation(conv)


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(user_id: Optional[str] = Header(None), limit: int = 20):
    if not is_db_available():
        raise HTTPException(status_code=503, detail="Conversation storage is unavailable")
    db = get_db()
    cursor = (
        db.conversations.find({"userId": user_id or "anonymous"})
        .sort("updatedAt", -1)
        .limit(limit)
    )
    conversations = await cursor.to_list(length=limit)
    return [_serialize_conversation(c) for c in conversations]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str):
    if not is_db_available():
        raise HTTPException(status_code=503, detail="Conversation storage is unavailable")
    db = get_db()
    conv = await db.conversations.find_one({"_id": _parse_object_id(conversation_id)})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = conv.get("messages", [])
    return ConversationDetail(
        id=str(conv["_id"]),
        title=conv.get("title", "New conversation"),
        messages=[Message(**m) for m in messages],
        createdAt=conv.get("createdAt", datetime.utcnow()),
        updatedAt=conv.get("updatedAt", datetime.utcnow()),
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    if not is_db_available():
        raise HTTPException(status_code=503, detail="Conversation storage is unavailable")
    db = get_db()
    result = await db.conversations.delete_one({"_id": _parse_object_id(conversation_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True}


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    user_id: Optional[str] = Header(None),
):
    if not is_db_available():
        raise HTTPException(status_code=503, detail="Conversation storage is unavailable")
    db = get_db()
    user_id = user_id or "anonymous"

    if request.conversationId:
        conv = await db.conversations.find_one({"_id": _parse_object_id(request.conversationId)})
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv_data = {
            "userId": user_id,
            "title": request.message[:60] + ("..." if len(request.message) > 60 else ""),
            "messages": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        result = await db.conversations.insert_one(conv_data)
        conv_data["_id"] = result.inserted_id
        conv = conv_data

    user_msg = {"role": "user", "content": request.message, "createdAt": datetime.utcnow()}
    await db.conversations.update_one(
        {"_id": conv["_id"]},
        {"$push": {"messages": user_msg}, "$set": {"updatedAt": datetime.utcnow()}},
    )

    user_context_raw = await get_user_context(user_id)
    hotel_context_raw = await get_hotel_context(limit=3)
    user_context = json.dumps(user_context_raw, default=str)
    hotel_context = json.dumps(hotel_context_raw, default=str)

    messages_for_llm = conv.get("messages", []) + [user_msg]
    ai_content = await generate_response(
        messages=messages_for_llm,
        user_id=user_id,
        user_context=user_context,
        hotel_context=hotel_context,
        language=request.language,
        language_name=request.languageName,
    )

    ai_msg = {"role": "assistant", "content": ai_content, "createdAt": datetime.utcnow()}
    await db.conversations.update_one(
        {"_id": conv["_id"]},
        {"$push": {"messages": ai_msg}, "$set": {"updatedAt": datetime.utcnow()}},
    )

    return ChatResponse(conversationId=str(conv["_id"]), message=ai_content)


@router.post("/message/stream")
async def send_message_stream(
    request: ChatRequest,
    user_id: Optional[str] = Header(None),
):
    if not is_db_available():
        raise HTTPException(status_code=503, detail="Conversation storage is unavailable")
    db = get_db()
    user_id = user_id or "anonymous"

    if request.conversationId:
        conv = await db.conversations.find_one({"_id": _parse_object_id(request.conversationId)})
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv_data = {
            "userId": user_id,
            "title": request.message[:60] + ("..." if len(request.message) > 60 else ""),
            "messages": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        result = await db.conversations.insert_one(conv_data)
        conv_data["_id"] = result.inserted_id
        conv = conv_data

    user_msg = {"role": "user", "content": request.message, "createdAt": datetime.utcnow()}
    await db.conversations.update_one(
        {"_id": conv["_id"]},
        {"$push": {"messages": user_msg}, "$set": {"updatedAt": datetime.utcnow()}},
    )

    user_context_raw = await get_user_context(user_id)
    hotel_context_raw = await get_hotel_context(limit=3)
    user_context = json.dumps(user_context_raw, default=str)
    hotel_context = json.dumps(hotel_context_raw, default=str)

    messages_for_llm = conv.get("messages", []) + [user_msg]
    conversation_id = str(conv["_id"])

    async def event_generator():
        full_content = ""
        async for token in generate_streaming_response(
            messages=messages_for_llm,
            user_id=user_id,
            user_context=user_context,
            hotel_context=hotel_context,
            language=request.language,
            language_name=request.languageName,
        ):
            full_content += token
            yield {"event": "token", "data": json.dumps({"token": token})}

        ai_msg = {"role": "assistant", "content": full_content, "createdAt": datetime.utcnow()}
        await db.conversations.update_one(
            {"_id": conv["_id"]},
            {"$push": {"messages": ai_msg}, "$set": {"updatedAt": datetime.utcnow()}},
        )
        yield {"event": "done", "data": json.dumps({"conversationId": conversation_id})}

    return EventSourceResponse(event_generator())
