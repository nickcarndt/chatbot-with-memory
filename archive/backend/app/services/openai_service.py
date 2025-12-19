import os
import time
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv
from ..core.logging_config import get_logger

# Load environment variables
load_dotenv()

# Try to get OpenAI API key from environment or Secret Manager
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client with proper error handling
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)
else:
    client = None

logger = get_logger(__name__)


def get_chat_completion(
    messages: List[dict], 
    conversation_id: Optional[int] = None,
    request_id: Optional[str] = None
) -> str:
    """
    Get chat completion from OpenAI with observability logging.
    
    Args:
        messages: List of message dicts with role and content
        conversation_id: Optional conversation ID for personality selection
        request_id: Optional request ID for tracing
        
    Returns:
        Assistant response content
    """
    if not OPENAI_API_KEY:
        logger.error(
            "openai_api_key_missing",
            request_id=request_id,
            conversation_id=conversation_id,
        )
        raise RuntimeError("OPENAI_API_KEY is not set")
    
    if not client:
        logger.error(
            "openai_client_not_initialized",
            request_id=request_id,
            conversation_id=conversation_id,
        )
        raise RuntimeError("OpenAI client is not initialized")
    
    model = "gpt-3.5-turbo"
    start_time = time.time()
    
    # Add conversation context and variety
    system_messages = [
        "You are a helpful AI assistant with a friendly personality. You enjoy having conversations and providing useful, accurate information. You have a good sense of humor and like to share jokes and interesting facts.",
        "You are a knowledgeable AI assistant who loves to help people learn and discover new things. You have a warm, engaging personality and enjoy sharing educational content in creative ways.",
        "You are an intelligent AI assistant with a curious mind. You enjoy exploring topics in depth and having meaningful conversations. You're particularly good at explaining complex concepts simply.",
        "You are a creative AI assistant who loves to think outside the box. You enjoy coming up with unique perspectives, creative solutions, and imaginative responses to questions.",
        "You are a thoughtful AI assistant who values deep thinking and meaningful dialogue. You enjoy exploring complex topics together and providing well-reasoned, insightful responses.",
        "You are an enthusiastic AI assistant who gets excited about interesting topics and loves to share knowledge. You have a positive attitude and enjoy making learning fun.",
        "You are a witty AI assistant with a sharp sense of humor. You enjoy clever wordplay, puns, and making people smile while still being helpful and informative.",
        "You are a philosophical AI assistant who enjoys deep conversations about life, meaning, and the human experience. You provide thoughtful, reflective responses."
    ]
    
    # Select system message based on conversation ID for consistency within a conversation
    # but variety across conversations
    if conversation_id:
        system_message = system_messages[conversation_id % len(system_messages)]
    else:
        system_message = system_messages[0]
    
    # Add system message at the beginning
    enhanced_messages = [{"role": "system", "content": system_message}] + messages
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=enhanced_messages,
            temperature=0.8,  # Increased for more variety
            max_tokens=1000,  # Limit response length
            presence_penalty=0.6,  # Encourage new topics
            frequency_penalty=0.3,  # Reduce repetition
        )
        
        duration_ms = (time.time() - start_time) * 1000
        
        # Log successful OpenAI call (NO content or secrets)
        logger.info(
            "openai_request_success",
            request_id=request_id,
            conversation_id=conversation_id,
            model=model,
            duration_ms=round(duration_ms, 2),
            message_count=len(messages),
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        error_type = type(e).__name__
        
        # Log failed OpenAI call (NO content or secrets)
        logger.error(
            "openai_request_failed",
            request_id=request_id,
            conversation_id=conversation_id,
            model=model,
            duration_ms=round(duration_ms, 2),
            error_type=error_type,
            message_count=len(messages),
        )
        
        # Return a fallback message if OpenAI API fails
        return f"I apologize, but I'm having trouble connecting to my AI service right now. Error: {str(e)}"


