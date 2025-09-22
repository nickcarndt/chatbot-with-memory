import os
from typing import List
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY


def get_chat_completion(messages: List[dict], conversation_id: int = None) -> str:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set")
    
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
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=enhanced_messages,
        temperature=0.8,  # Increased for more variety
        max_tokens=1000,  # Limit response length
        presence_penalty=0.6,  # Encourage new topics
        frequency_penalty=0.3,  # Reduce repetition
    )
    return response.choices[0].message.content


