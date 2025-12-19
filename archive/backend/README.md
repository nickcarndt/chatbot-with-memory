### Chatbot with Memory - Backend

This is the FastAPI backend for Chatbot with Memory.

#### Setup

1. Create a virtual environment (recommended)
```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Configure environment
```bash
cp .env.example .env
# edit .env to add your OpenAI API key
```

4. Run the server
```bash
./run.sh
```

The API will be available at http://localhost:8000. Docs at http://localhost:8000/docs

#### API Overview
- POST /api/v1/conversations: create new conversation
- GET /api/v1/conversations: list conversations
- GET /api/v1/conversations/{id}: get conversation with messages
- GET /api/v1/conversations/{id}/messages: list messages
- POST /api/v1/conversations/{id}/messages: add user message and get assistant reply


