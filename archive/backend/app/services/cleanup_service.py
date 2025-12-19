"""
Database cleanup service for automated maintenance
Prevents database bloat and controls costs
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..db.session import SessionLocal
from ..models.models import Conversation, Message
from typing import Tuple


def cleanup_old_conversations(days_old: int = 7) -> Tuple[int, int]:
    """
    Clean up conversations older than specified days
    Returns: (conversations_deleted, messages_deleted)
    """
    db = SessionLocal()
    try:
        from sqlalchemy import text
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Find old conversations
        old_conversations = db.query(Conversation).filter(
            Conversation.created_at < cutoff_date
        ).all()
        
        conversations_deleted = len(old_conversations)
        messages_deleted = 0
        
        # Delete conversations (messages will be deleted due to cascade)
        for conversation in old_conversations:
            messages_deleted += len(conversation.messages)
            db.delete(conversation)
        
        db.commit()
        return conversations_deleted, messages_deleted
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def cleanup_excess_conversations(max_conversations: int = 30) -> Tuple[int, int]:
    """
    Keep only the most recent conversations
    Returns: (conversations_deleted, messages_deleted)
    """
    db = SessionLocal()
    try:
        # Get total count
        total_count = db.query(Conversation).count()
        
        if total_count <= max_conversations:
            return 0, 0
        
        # Get conversations to delete (oldest first)
        conversations_to_delete = db.query(Conversation).order_by(
            Conversation.created_at.asc()
        ).limit(total_count - max_conversations).all()
        
        conversations_deleted = len(conversations_to_delete)
        messages_deleted = 0
        
        for conversation in conversations_to_delete:
            messages_deleted += len(conversation.messages)
            db.delete(conversation)
        
        db.commit()
        return conversations_deleted, messages_deleted
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def get_database_stats() -> dict:
    """Get current database statistics"""
    db = SessionLocal()
    try:
        conversation_count = db.query(Conversation).count()
        message_count = db.query(Message).count()
        
        # Get oldest conversation date
        oldest_conversation = db.query(Conversation).order_by(
            Conversation.created_at.asc()
        ).first()
        
        oldest_date = oldest_conversation.created_at if oldest_conversation else None
        
        return {
            "conversations": conversation_count,
            "messages": message_count,
            "oldest_conversation": oldest_date.isoformat() if oldest_date else None
        }
        
    finally:
        db.close()
