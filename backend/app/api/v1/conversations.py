from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from ...db.session import SessionLocal
from ...db import crud
from ...models.models import Conversation
from ...schemas.conversation import (
    ConversationCreate,
    ConversationRead,
    MessageCreate,
    MessageRead,
)
from ...services.openai_service import get_chat_completion
from typing import List


router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ConversationRead)
@limiter.limit("3/minute")  # Limit to 3 new conversations per minute
def create_conversation_endpoint(
    request: Request,
    payload: ConversationCreate, db: Session = Depends(get_db)
):
    # Check conversation limit (prevent database bloat)
    existing_count = db.query(Conversation).count()
    if existing_count >= 50:  # Limit to 50 conversations total
        raise HTTPException(
            status_code=429, 
            detail="Maximum conversation limit reached. Please clear some conversations first."
        )
    
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
@limiter.limit("5/minute")  # Limit to 5 messages per minute per IP
def add_message_and_respond_endpoint(
    request: Request,
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


@router.delete("/", response_model=dict)
@limiter.limit("2/minute")  # Limit to 2 clear operations per minute
def clear_all_conversations_endpoint(request: Request, db: Session = Depends(get_db)):
    """Clear all conversations and messages - useful for cost control"""
    try:
        # Delete all messages first (due to foreign key constraints)
        db.execute("DELETE FROM messages")
        # Delete all conversations
        db.execute("DELETE FROM conversations")
        db.commit()
        return {"message": "All conversations cleared successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing conversations: {str(e)}")


@router.delete("/{conversation_id}", response_model=dict)
def delete_conversation_endpoint(conversation_id: int, db: Session = Depends(get_db)):
    """Delete a specific conversation"""
    conversation = crud.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    try:
        db.delete(conversation)
        db.commit()
        return {"message": f"Conversation {conversation_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting conversation: {str(e)}")


