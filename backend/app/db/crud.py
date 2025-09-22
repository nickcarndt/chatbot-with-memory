from sqlalchemy.orm import Session
from ..models.models import Conversation, Message
from ..schemas.conversation import ConversationCreate, MessageCreate
from typing import List, Optional


def create_conversation(db: Session, data: ConversationCreate) -> Conversation:
    conversation = Conversation(title=data.title or "New Conversation")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def list_conversations(db: Session) -> List[Conversation]:
    return db.query(Conversation).order_by(Conversation.created_at.desc()).all()


def get_conversation(db: Session, conversation_id: int) -> Optional[Conversation]:
    return db.query(Conversation).filter(Conversation.id == conversation_id).first()


def add_message(db: Session, conversation_id: int, data: MessageCreate) -> Message:
    message = Message(conversation_id=conversation_id, role=data.role, content=data.content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_messages(db: Session, conversation_id: int) -> List[Message]:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )


