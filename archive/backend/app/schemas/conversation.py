from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class MessageCreate(BaseModel):
    role: str = Field(..., pattern=r"^(user|assistant|system)$")
    content: str


class MessageRead(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    title: Optional[str] = None


class ConversationRead(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: List[MessageRead] = []

    class Config:
        from_attributes = True


