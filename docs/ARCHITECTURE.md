# Technical Architecture

## System Overview

The Chatbot with Memory application follows a modern full-stack architecture with clear separation of concerns between the frontend and backend components.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                          │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Web Browser   │    │   Mobile Browser│                   │
│  │   (React App)   │    │   (Responsive)  │                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │ JSON over HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                           │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   API Layer     │    │  Business Logic │                   │
│  │   - Endpoints   │    │  - OpenAI Int.  │                   │
│  │   - Validation  │    │  - Personality  │                   │
│  │   - CORS        │    │  - Response Gen │                   │
│  └─────────────────┘    └─────────────────┘                   │
│                              │                                │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Data Layer    │    │  External APIs  │                   │
│  │   - SQLAlchemy  │    │  - OpenAI API   │                   │
│  │   - CRUD Ops    │    │  - GPT-3.5-turbo│                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Storage                              │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   SQLite DB     │    │   File System   │                   │
│  │   - Conversations│    │   - Logs        │                   │
│  │   - Messages    │    │   - Config      │                   │
│  │   - Persistence │    │   - Static Files│                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend (React)

**Technology Stack:**
- React 18 with TypeScript
- Axios for HTTP client
- CSS3 for styling
- Modern ES6+ JavaScript

**Key Components:**
```
src/
├── components/
│   ├── App.tsx              # Main application component
│   ├── ChatWindow.tsx       # Chat interface container
│   ├── MessageList.tsx      # Message display component
│   ├── MessageInput.tsx     # Message input form
│   └── ConversationList.tsx # Conversation sidebar
├── services/
│   └── api.ts              # API service layer
├── types/
│   └── index.ts            # TypeScript type definitions
└── App.css                 # Global styles
```

**State Management:**
- React hooks (`useState`, `useEffect`)
- Local component state for UI
- API service for data fetching
- Real-time updates via polling

### Backend (FastAPI)

**Technology Stack:**
- Python 3.9+
- FastAPI web framework
- SQLAlchemy ORM
- Pydantic for data validation
- Uvicorn ASGI server

**Project Structure:**
```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── conversations.py    # Conversation endpoints
│   │       └── router.py           # API router
│   ├── db/
│   │   ├── crud.py                # Database operations
│   │   └── session.py             # Database connection
│   ├── models/
│   │   └── models.py              # SQLAlchemy models
│   ├── schemas/
│   │   └── conversation.py        # Pydantic schemas
│   ├── services/
│   │   └── openai_service.py      # OpenAI integration
│   └── main.py                    # Application factory
├── requirements.txt
└── .env
```

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│   Conversations │         │     Messages    │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────────┤ conversation_id │
│ title           │   1:N   │ id (PK)         │
│ created_at      │         │ role            │
└─────────────────┘         │ content         │
                            │ created_at      │
                            └─────────────────┘
```

### Database Schema

**Conversations Table:**
```sql
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Messages Table:**
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

## API Design

### RESTful Principles

**Resource-Based URLs:**
- `/conversations/` - Collection of conversations
- `/conversations/{id}` - Specific conversation
- `/conversations/{id}/messages` - Messages in a conversation

**HTTP Methods:**
- `GET` - Retrieve resources
- `POST` - Create new resources
- `PUT` - Update existing resources (not implemented)
- `DELETE` - Remove resources (not implemented)

**Status Codes:**
- `200 OK` - Successful GET request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Request/Response Format

**Request Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Response Format:**
```json
{
  "id": 1,
  "title": "My Conversation",
  "created_at": "2024-01-15T10:30:00",
  "messages": [...]
}
```

## AI Integration

### OpenAI Service Architecture

**Personality System:**
```python
def get_chat_completion(messages: List[dict], conversation_id: int = None) -> str:
    # Select personality based on conversation ID
    personality = personalities[conversation_id % len(personalities)]
    
    # Add system message with personality
    enhanced_messages = [{"role": "system", "content": personality}] + messages
    
    # Call OpenAI API with enhanced parameters
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=enhanced_messages,
        temperature=0.8,
        max_tokens=1000,
        presence_penalty=0.6,
        frequency_penalty=0.3
    )
    return response.choices[0].message.content
```

**Personality Rotation:**
- 8 unique AI personalities
- Consistent within conversation (same ID = same personality)
- Varied across conversations (different IDs = different personalities)

## Security Considerations

### Current Implementation
- CORS enabled for frontend communication
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy ORM
- Environment variable management

### Production Recommendations
- JWT authentication for API access
- Rate limiting to prevent abuse
- HTTPS enforcement
- API key rotation
- Input sanitization
- SQL injection prevention (already implemented)
- XSS protection

## Performance Considerations

### Backend Optimizations
- SQLAlchemy connection pooling
- Efficient database queries
- Response caching (not implemented)
- Async/await for I/O operations

### Frontend Optimizations
- Component memoization (not implemented)
- Lazy loading (not implemented)
- Image optimization (not implemented)
- Bundle splitting (not implemented)

### Database Optimizations
- Indexed primary keys
- Foreign key constraints
- Efficient query patterns
- Connection pooling

## Scalability Considerations

### Current Limitations
- Single SQLite database
- No horizontal scaling
- No load balancing
- No caching layer

### Scaling Strategies
- **Database**: Migrate to PostgreSQL for production
- **Caching**: Add Redis for session storage
- **Load Balancing**: Use Nginx or similar
- **Containerization**: Docker for deployment
- **Microservices**: Split into smaller services
- **CDN**: For static assets

## Deployment Architecture

### Development Environment
```
Developer Machine
├── React Dev Server (Port 3000)
├── FastAPI Dev Server (Port 8000)
└── SQLite Database (Local file)
```

### Production Environment (Recommended)
```
Load Balancer (Nginx)
├── React App (Static files)
├── FastAPI App (Multiple instances)
├── PostgreSQL Database
└── Redis Cache
```

## Monitoring and Logging

### Current Implementation
- Basic FastAPI logging
- Error handling with try/catch
- Console output for debugging

### Production Recommendations
- Structured logging (JSON format)
- Log aggregation (ELK stack)
- Application monitoring (Prometheus/Grafana)
- Error tracking (Sentry)
- Health checks
- Metrics collection

## Development Workflow

### Backend Development
1. Set up virtual environment
2. Install dependencies
3. Configure environment variables
4. Run database migrations
5. Start development server

### Frontend Development
1. Install Node.js dependencies
2. Configure API URL
3. Start development server
4. Hot reload for development

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance testing for load scenarios
