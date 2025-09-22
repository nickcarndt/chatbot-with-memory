from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...db.session import SessionLocal
from ...db import crud
from ...schemas.conversation import (
    ConversationCreate,
    ConversationRead,
    MessageCreate,
    MessageRead,
)
from ...services.openai_service import get_chat_completion
from typing import List


router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ConversationRead)
def create_conversation_endpoint(
    payload: ConversationCreate, db: Session = Depends(get_db)
):
    conversation = crud.create_conversation(db, payload)
    return conversation


@router.get("/", response_model=List[ConversationRead])
def list_conversations_endpoint(db: Session = Depends(get_db)):
    return crud.list_conversations(db)


@router.get("/{conversation_id}", response_model=ConversationRead)
def get_conversation_endpoint(conversation_id: int, db: Session = Depends(get_db)):
    conversation = crud.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get("/{conversation_id}/messages", response_model=List[MessageRead])
def get_messages_endpoint(conversation_id: int, db: Session = Depends(get_db)):
    return crud.get_messages(db, conversation_id)


@router.post("/{conversation_id}/messages", response_model=MessageRead)
def add_message_and_respond_endpoint(
    conversation_id: int, payload: MessageCreate, db: Session = Depends(get_db)
):
    conversation = crud.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    # Save user message
    _ = crud.add_message(db, conversation_id, payload)
    # Build history for LLM
    history = [
        {"role": m.role, "content": m.content}
        for m in crud.get_messages(db, conversation_id)
    ]
    # Get assistant response
    assistant_content = get_chat_completion(history, conversation_id)
    assistant_message = crud.add_message(
        db,
        conversation_id,
        MessageCreate(role="assistant", content=assistant_content),
    )
    return assistant_message


