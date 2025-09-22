# Setup Guide

This guide will walk you through setting up the Chatbot with Memory application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Python 3.9+** - [Download Python](https://python.org/downloads/)
- **Node.js 16+** - [Download Node.js](https://nodejs.org/downloads/)
- **Git** - [Download Git](https://git-scm.com/downloads)
- **OpenAI API Key** - [Get API Key](https://platform.openai.com/api-keys)

### Verify Installations
```bash
# Check Python version
python --version
# Should output: Python 3.9.x or higher

# Check Node.js version
node --version
# Should output: v16.x.x or higher

# Check npm version
npm --version
# Should output: 8.x.x or higher

# Check Git version
git --version
# Should output: git version 2.x.x or higher
```

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/nickcarndt/chatbot-with-memory.git
cd chatbot-with-memory
```

### 2. Backend Setup

#### Step 1: Navigate to Backend Directory
```bash
cd backend
```

#### Step 2: Create Virtual Environment
```bash
# On macOS/Linux
python -m venv .venv
source .venv/bin/activate

# On Windows
python -m venv .venv
.venv\Scripts\activate
```

#### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Configure Environment Variables
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your OpenAI API key
# On macOS/Linux
nano .env

# On Windows
notepad .env
```

**Required Environment Variables:**
```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///./chat.db
```

#### Step 5: Start the Backend Server
```bash
# Using the provided script
./run.sh

# Or manually
uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000 --reload
```

**Verify Backend is Running:**
- Open your browser and go to `http://localhost:8000/docs`
- You should see the FastAPI interactive documentation

### 3. Frontend Setup

#### Step 1: Navigate to Frontend Directory
```bash
# From the project root
cd frontend
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Configure Environment Variables
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file
# On macOS/Linux
nano .env

# On Windows
notepad .env
```

**Required Environment Variables:**
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

#### Step 4: Start the Frontend Server
```bash
npm start
```

**Verify Frontend is Running:**
- Open your browser and go to `http://localhost:3000`
- You should see the chat interface

## Detailed Setup Instructions

### Backend Configuration

#### Environment Variables Explained

**`.env` file:**
```env
# OpenAI Configuration
OPENAI_API_KEY=REDACTED

# Database Configuration
DATABASE_URL=sqlite:///./chat.db

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Database Setup
The application uses SQLite by default, which requires no additional setup. The database file (`chat.db`) will be created automatically when you first run the application.

#### OpenAI API Key Setup
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env` file
5. **Important**: Never commit your API key to version control

### Frontend Configuration

#### Environment Variables Explained

**`.env` file:**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api/v1

# Development Configuration
REACT_APP_DEBUG=true
REACT_APP_VERSION=1.0.0
```

#### API URL Configuration
- `REACT_APP_API_URL`: The base URL for your backend API
- For local development: `http://localhost:8000/api/v1`
- For production: Update to your production API URL

## Troubleshooting

### Common Issues

#### 1. Python Virtual Environment Issues
**Problem:** `python: command not found`
**Solution:**
```bash
# Try python3 instead
python3 -m venv .venv
source .venv/bin/activate
```

#### 2. Node.js Version Issues
**Problem:** `npm install` fails with version errors
**Solution:**
```bash
# Update Node.js to latest LTS version
# Or use nvm to manage Node.js versions
nvm install 18
nvm use 18
```

#### 3. OpenAI API Key Issues
**Problem:** `RuntimeError: OPENAI_API_KEY is not set`
**Solution:**
1. Verify your `.env` file exists in the backend directory
2. Check that the API key is correctly formatted
3. Ensure there are no extra spaces or quotes around the key
4. Restart the backend server after making changes

#### 4. CORS Issues
**Problem:** Frontend can't connect to backend
**Solution:**
1. Verify backend is running on port 8000
2. Check that `REACT_APP_API_URL` is correct
3. Ensure CORS is properly configured in backend

#### 5. Database Issues
**Problem:** Database file not created
**Solution:**
1. Ensure you have write permissions in the backend directory
2. Check that SQLite is properly installed
3. Verify the `DATABASE_URL` in your `.env` file

### Port Conflicts

#### Backend Port 8000 Already in Use
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8001 --reload
```

#### Frontend Port 3000 Already in Use
```bash
# React will automatically use the next available port
# Or specify a different port
PORT=3001 npm start
```

## Development Workflow

### Daily Development
1. **Start Backend:**
   ```bash
   cd backend
   source .venv/bin/activate
   ./run.sh
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Make Changes:**
   - Backend changes will auto-reload
   - Frontend changes will hot-reload

### Testing Changes
1. **Backend Testing:**
   - Use the interactive docs at `http://localhost:8000/docs`
   - Test API endpoints with curl or Postman

2. **Frontend Testing:**
   - Use the browser developer tools
   - Check the Network tab for API calls
   - Verify console for any errors

### Stopping the Application
- **Backend:** Press `Ctrl+C` in the terminal
- **Frontend:** Press `Ctrl+C` in the terminal

## Production Setup

### Backend Production
1. **Use Production Database:**
   ```env
   DATABASE_URL=REDACTEDser:password@localhost/chatbot_db
   ```

2. **Set Production Environment:**
   ```env
   DEBUG=False
   ```

3. **Use Production Server:**
   ```bash
   gunicorn app.main:create_app --factory -w 4 -k uvicorn.workers.UvicornWorker
   ```

### Frontend Production
1. **Build for Production:**
   ```bash
   npm run build
   ```

2. **Serve Static Files:**
   ```bash
   npx serve -s build
   ```

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Issues](https://github.com/nickcarndt/chatbot-with-memory/issues) page
2. Create a new issue with:
   - Your operating system
   - Python and Node.js versions
   - Error messages
   - Steps to reproduce the issue

## Next Steps

Once you have the application running:

1. **Explore the Features:**
   - Create new conversations
   - Send messages and see AI responses
   - Notice the different AI personalities

2. **Customize the Application:**
   - Modify the AI personalities
   - Add new features
   - Customize the UI

3. **Deploy to Production:**
   - Follow the production setup guide
   - Deploy to your preferred platform
