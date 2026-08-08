from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class Message(BaseModel):
    role: MessageRole
    content: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class Conversation(BaseModel):
    userId: str
    title: str = "New conversation"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class ConversationResponse(BaseModel):
    id: str
    title: str
    preview: str
    createdAt: datetime
    updatedAt: datetime


class ChatRequest(BaseModel):
    message: str
    conversationId: Optional[str] = None
    language: Optional[str] = None
    languageName: Optional[str] = None


class ChatResponse(BaseModel):
    conversationId: str
    message: str


class ConversationDetail(BaseModel):
    id: str
    title: str
    messages: List[Message]
    createdAt: datetime
    updatedAt: datetime
