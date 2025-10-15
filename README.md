# Chatbot with Memory

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0+-61dafb.svg)](https://reactjs.org)
[![SQLite](https://img.shields.io/badge/SQLite-3+-003b57.svg)](https://sqlite.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5--turbo-412991.svg)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A full-stack conversational AI application with persistent memory and dynamic personality system. Built with FastAPI backend, React frontend, and SQLite database for conversation storage.

## 🛡️ Production Safety & Cost Control

This application includes comprehensive safety measures to prevent abuse and control costs:

- **Rate Limiting**: 5 messages/minute, 3 conversations/minute per IP
- **Resource Limits**: Max 5 backend instances, 3 frontend instances  
- **Database Controls**: Max 50 conversations, auto-cleanup after 7 days
- **Manual Controls**: One-click "Clear All" button for cost control
- **Monitoring**: Database stats and cleanup endpoints

See [PRODUCTION_SAFETY.md](PRODUCTION_SAFETY.md) for detailed safety documentation.

## 🚀 Features

- **Real-time Chat Interface**: Modern React frontend with responsive design
- **Persistent Memory**: SQLite database stores conversation history across sessions
- **AI Personality System**: 8 unique AI personalities that rotate per conversation
- **RESTful API**: Clean FastAPI backend with comprehensive endpoint documentation
- **Memory Retention**: Conversations persist between sessions
- **Dynamic Responses**: Enhanced OpenAI parameters for varied, creative responses
- **Clean Architecture**: Separation of concerns with backend/frontend independence

## 🎯 AI Personality System

Each conversation gets assigned one of 8 unique AI personalities:

1. **Friendly Helper** - Good sense of humor, shares jokes and facts
2. **Educational Guide** - Creative teaching with warm personality
3. **Deep Thinker** - Explains complex concepts simply
4. **Creative Problem Solver** - Unique perspectives and imaginative responses
5. **Philosophical** - Thoughtful, reflective responses
6. **Enthusiastic Learner** - Excited about topics, makes learning fun
7. **Witty Humorist** - Sharp humor, wordplay, and puns
8. **Life Philosopher** - Deep conversations about meaning and experience

## 📸 Screenshots

### Chat Interface
![Chat Interface](https://raw.githubusercontent.com/nickcarndt/chatbot-with-memory/master/screenshots/Chat%20Interface.png)
*Modern React chat interface with real-time messaging*

### Conversation History
![Conversation History](https://raw.githubusercontent.com/nickcarndt/chatbot-with-memory/master/screenshots/Conversation%20History.png)
*Persistent conversation history with sidebar navigation*

### AI Personality System
![Academic Personality](https://raw.githubusercontent.com/nickcarndt/chatbot-with-memory/master/screenshots/Personality%201%20-%20Academic%20-%20Detailed%20technical%20explanation.png)
*Academic personality providing detailed technical explanations*

![Conversational Personality](https://raw.githubusercontent.com/nickcarndt/chatbot-with-memory/master/screenshots/Personality%202%20-%20Conversational%20-%20Friendly%2C%20accessible%20response%20.png)
*Conversational personality with friendly, accessible responses*

![Enthusiastic Personality](https://raw.githubusercontent.com/nickcarndt/chatbot-with-memory/master/screenshots/Personality%203%20-%20Enthusiastic%20-%20Excited%2C%20future-focused%20answer.png)
*Enthusiastic personality delivering excited, future-focused answers*

### Memory & Context Features
![Memory Test](https://raw.githubusercontent.com/nickcarndt/chatbot-with-memory/master/screenshots/Memory%20Test.png)
*Demonstrating conversation memory across sessions*

![Context Continuity](https://raw.githubusercontent.com/nickcarndt/chatbot-with-memory/master/screenshots/Context%20Continuity.png)
*Showing context continuity and conversation flow*

![New Conversation](https://raw.githubusercontent.com/nickcarndt/chatbot-with-memory/master/screenshots/New%20Conversation.png)
*Creating new conversations with unique AI personalities*

## 🛠️ Tech Stack

### Backend
- **Python 3.9+** - Core programming language
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Lightweight database for conversation storage
- **OpenAI API** - GPT-3.5-turbo for AI responses
- **Pydantic** - Data validation using Python type annotations
- **Uvicorn** - ASGI server for production

### Frontend
- **React 18** - User interface library
- **TypeScript** - Type-safe JavaScript
- **Axios** - HTTP client for API communication
- **CSS3** - Modern styling with responsive design

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- OpenAI API key

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/nickcarndt/chatbot-with-memory.git
   cd chatbot-with-memory
   ```

2. **Set up Python environment**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env and add your OpenAI API key
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   ```

4. **Start the backend server**
   ```bash
   ./run.sh
   # Or manually:
   uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API URL**
   ```bash
   cp env.example .env
   # Edit .env to set the backend URL
   echo "REACT_APP_API_URL=http://localhost:8000/api/v1" > .env
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Technical Architecture

### System Design
```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│ React Frontend  │ ◄─────────────► │ FastAPI Backend │
│                 │                 │                 │
│ - Chat Interface│                 │ - REST API      │
│ - State Mgmt    │                 │ - OpenAI Int.   │
│ - TypeScript    │                 │ - SQLAlchemy    │
└─────────────────┘                 └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ SQLite Database │
                                    │                 │
                                    │ - Conversations │
                                    │ - Messages      │
                                    └─────────────────┘
```

### Database Schema
- **Conversations Table**: Stores conversation metadata
- **Messages Table**: Stores individual messages with role and content
- **Relationships**: One-to-many between conversations and messages

### API Design
- **RESTful endpoints** for CRUD operations
- **JSON responses** with proper HTTP status codes
- **CORS enabled** for frontend communication
- **Error handling** with detailed error messages

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints

#### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations/` | Get all conversations |
| `POST` | `/conversations/` | Create new conversation |
| `GET` | `/conversations/{id}` | Get specific conversation |
| `GET` | `/conversations/{id}/messages` | Get messages for conversation |

#### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/conversations/{id}/messages` | Send message and get AI response |

### Example API Usage

**Create a new conversation:**
```bash
curl -X POST http://localhost:8000/api/v1/conversations/ \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat Session"}'
```

**Send a message:**
```bash
curl -X POST http://localhost:8000/api/v1/conversations/1/messages \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Hello, tell me a joke!"}'
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///./chat.db
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### OpenAI Configuration
- **Model**: GPT-3.5-turbo
- **Temperature**: 0.8 (for creative responses)
- **Max Tokens**: 1000
- **Presence Penalty**: 0.6
- **Frequency Penalty**: 0.3

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Manual Testing
1. Start both backend and frontend servers
2. Open browser to `http://localhost:3000`
3. Create a new conversation
4. Send messages and verify AI responses
5. Check conversation persistence by refreshing the page

## 📁 Project Structure

```
chatbot-with-memory/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── conversations.py
│   │   │       └── router.py
│   │   ├── db/
│   │   │   ├── crud.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   └── conversation.py
│   │   ├── services/
│   │   │   └── openai_service.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── run.sh
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
├── screenshots/
├── docs/
├── README.md
└── LICENSE
```

## 🚀 Deployment

### Backend Deployment
1. Set up production database (PostgreSQL recommended)
2. Configure environment variables
3. Use production ASGI server (Gunicorn + Uvicorn)
4. Set up reverse proxy (Nginx)

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Serve static files with web server
3. Configure API URL for production backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nick Arndt**
- GitHub: [@nickcarndt](https://github.com/nickcarndt)
- LinkedIn: [Nick Arndt](https://linkedin.com/in/nickarndt)

## 🙏 Acknowledgments

- OpenAI for the GPT-3.5-turbo API
- FastAPI team for the excellent web framework
- React team for the frontend library
- SQLite for the lightweight database solution

---

**Note**: This is a portfolio project demonstrating full-stack development skills with modern web technologies and AI integration.