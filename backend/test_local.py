#!/usr/bin/env python3
"""
Quick test script to verify OpenAI API connection locally
Run this to test if the issue is with Google Cloud or the code itself
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_openai_connection():
    print("🔍 Testing OpenAI API connection locally...")
    
    # Check if API key is set
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        print("❌ OPENAI_API_KEY is not set or still has placeholder value")
        print("💡 Edit your .env file and add your real OpenAI API key")
        return False
    
    print(f"✅ API key found (length: {len(api_key)})")
    
    # Test OpenAI connection
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        print("🧪 Testing OpenAI API call...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello! This is a test message."}],
            max_tokens=50
        )
        
        print("✅ OpenAI API connection successful!")
        print(f"📝 Response: {response.choices[0].message.content}")
        return True
        
    except Exception as e:
        print(f"❌ OpenAI API connection failed: {str(e)}")
        return False

def test_backend_imports():
    print("\n🔍 Testing backend imports...")
    try:
        # Test if we can import the backend modules
        sys.path.append('.')
        from app.services.openai_service import get_chat_completion
        from app.db.session import SessionLocal
        from app.models.models import Conversation, Message
        
        print("✅ Backend imports successful!")
        return True
        
    except Exception as e:
        print(f"❌ Backend import failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Local Testing for Chatbot with Memory")
    print("=" * 50)
    
    # Test imports first
    imports_ok = test_backend_imports()
    
    # Test OpenAI connection
    openai_ok = test_openai_connection()
    
    print("\n" + "=" * 50)
    if imports_ok and openai_ok:
        print("🎉 All tests passed! The issue is likely with Google Cloud infrastructure.")
        print("💡 You can now run the backend locally with: ./run.sh")
    else:
        print("❌ Some tests failed. Check the errors above.")
        if not openai_ok:
            print("💡 Make sure to update your .env file with a real OpenAI API key")
