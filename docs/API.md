# API Documentation

## Overview

The Chatbot with Memory API is built with FastAPI and provides RESTful endpoints for managing conversations and messages. The API uses SQLite for data persistence and integrates with OpenAI's GPT-3.5-turbo for AI responses.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

Currently, no authentication is required. In a production environment, you would implement JWT tokens or similar authentication mechanisms.

## Content Type

All requests and responses use `application/json`.

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Endpoints

### Conversations

#### Get All Conversations
```http
GET /conversations/
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "My First Chat",
    "created_at": "2024-01-15T10:30:00",
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "Hello!",
        "created_at": "2024-01-15T10:30:00"
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "Hi there! How can I help you today?",
        "created_at": "2024-01-15T10:30:05"
      }
    ]
  }
]
```

#### Create New Conversation
```http
POST /conversations/
```

**Request Body:**
```json
{
  "title": "New Chat Session"
}
```

**Response:**
```json
{
  "id": 2,
  "title": "New Chat Session",
  "created_at": "2024-01-15T11:00:00",
  "messages": []
}
```

#### Get Specific Conversation
```http
GET /conversations/{conversation_id}
```

**Parameters:**
- `conversation_id` (integer): The ID of the conversation

**Response:**
```json
{
  "id": 1,
  "title": "My First Chat",
  "created_at": "2024-01-15T10:30:00",
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Hello!",
      "created_at": "2024-01-15T10:30:00"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "Hi there! How can I help you today?",
      "created_at": "2024-01-15T10:30:05"
    }
  ]
}
```

#### Get Messages for Conversation
```http
GET /conversations/{conversation_id}/messages
```

**Parameters:**
- `conversation_id` (integer): The ID of the conversation

**Response:**
```json
[
  {
    "id": 1,
    "role": "user",
    "content": "Hello!",
    "created_at": "2024-01-15T10:30:00"
  },
  {
    "id": 2,
    "role": "assistant",
    "content": "Hi there! How can I help you today?",
    "created_at": "2024-01-15T10:30:05"
  }
]
```

### Messages

#### Send Message and Get AI Response
```http
POST /conversations/{conversation_id}/messages
```

**Parameters:**
- `conversation_id` (integer): The ID of the conversation

**Request Body:**
```json
{
  "role": "user",
  "content": "Tell me a joke!"
}
```

**Response:**
```json
{
  "id": 3,
  "role": "assistant",
  "content": "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "created_at": "2024-01-15T11:15:00"
}
```

## Data Models

### Conversation
```json
{
  "id": "integer",
  "title": "string",
  "created_at": "datetime",
  "messages": "array of Message objects"
}
```

### Message
```json
{
  "id": "integer",
  "role": "string (user|assistant)",
  "content": "string",
  "created_at": "datetime"
}
```

### CreateConversationRequest
```json
{
  "title": "string"
}
```

### CreateMessageRequest
```json
{
  "role": "string (user|assistant)",
  "content": "string"
}
```

## AI Personality System

The API implements a unique AI personality system where each conversation is assigned one of 8 different AI personalities based on the conversation ID. This ensures:

1. **Consistency within conversations** - Same personality throughout a conversation
2. **Variety across conversations** - Different personalities for different conversations
3. **Enhanced user experience** - More engaging and varied interactions

### Personality Types

1. **Friendly Helper** - Good sense of humor, shares jokes and facts
2. **Educational Guide** - Creative teaching with warm personality
3. **Deep Thinker** - Explains complex concepts simply
4. **Creative Problem Solver** - Unique perspectives and imaginative responses
5. **Philosophical** - Thoughtful, reflective responses
6. **Enthusiastic Learner** - Excited about topics, makes learning fun
7. **Witty Humorist** - Sharp humor, wordplay, and puns
8. **Life Philosopher** - Deep conversations about meaning and experience

## OpenAI Integration

The API integrates with OpenAI's GPT-3.5-turbo model with the following configuration:

- **Model**: `gpt-3.5-turbo`
- **Temperature**: `0.8` (for creative responses)
- **Max Tokens**: `1000`
- **Presence Penalty**: `0.6` (encourages new topics)
- **Frequency Penalty**: `0.3` (reduces repetition)

## Example Usage

### Using curl

**Create a conversation:**
```bash
curl -X POST http://localhost:8000/api/v1/conversations/ \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat Session"}'
```

**Send a message:**
```bash
curl -X POST http://localhost:8000/api/v1/conversations/1/messages \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Hello, how are you?"}'
```

**Get conversation history:**
```bash
curl -X GET http://localhost:8000/api/v1/conversations/1
```

### Using JavaScript/Fetch

```javascript
// Create a new conversation
const createConversation = async (title) => {
  const response = await fetch('http://localhost:8000/api/v1/conversations/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  return await response.json();
};

// Send a message
const sendMessage = async (conversationId, content) => {
  const response = await fetch(`http://localhost:8000/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'user', content }),
  });
  return await response.json();
};
```

## Interactive API Documentation

FastAPI automatically generates interactive API documentation that you can access at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These interfaces allow you to test the API endpoints directly from your browser.
