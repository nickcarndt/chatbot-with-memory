# Chatbot with Memory

[![Next.js](https://img.shields.io/badge/Next.js-14.2+-000000.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6.svg)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791.svg)](https://neon.tech)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5--turbo-412991.svg)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A full-stack conversational AI application with persistent memory, built with Next.js App Router, TypeScript, and Neon PostgreSQL.

## 🚀 Features

- **Real-time Chat Interface**: Modern Next.js frontend with responsive design
- **Persistent Memory**: Neon PostgreSQL stores conversation history across sessions
- **AI Integration**: OpenAI GPT-3.5-turbo with conversation context
- **RESTful API**: Next.js API routes with structured logging
- **Memory Retention**: Conversations persist between sessions with full message history

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2+ (App Router)
- **Language**: TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-3.5-turbo
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Neon PostgreSQL database (free tier available)
- OpenAI API key

## 🚀 Local Development

### 1. Clone and Install

```bash
git clone <repository-url>
cd chatbot-with-memory
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
DATABASE_URL=REDACTEDser:password@host.neon.tech/dbname?sslmode=require
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

### 3. Set Up Database

**Get your Neon Database URL:**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (it should look like: `postgresql://REDACTEDser:password@host.neon.tech/dbname?sslmode=require`)
4. Add it to your `.env` file as `DATABASE_URL`

**Run Database Migrations:**

```bash
# Push schema to database (recommended for development)
npm run db:push

# Or generate and run migrations (for production)
npm run db:generate
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Smoke Test

Run the automated end-to-end smoke test to validate the entire application:

```bash
npm run smoke
```

**What it tests:**
1. ✅ Health check endpoint (`GET /api/health`) - validates server and database connectivity
2. ✅ Create conversation (`POST /api/conversations`)
3. ✅ Send message with memory (`POST /api/conversations/:id/messages`) - "Remember my favorite color is blue"
4. ✅ Test memory retention (`POST /api/conversations/:id/messages`) - "What is my favorite color?" (asserts response contains "blue")
5. ✅ Cleanup (`DELETE /api/conversations/:id`)

**Expected Output:**
```
Starting Next.js dev server...
Waiting for server to be ready...
Server is ready!

Starting smoke test...

✓ Health check
  Request ID: abc-123-def
✓ Create conversation
  Conversation ID: uuid-here
  Request ID: xyz-789-ghi
✓ Send message: Remember favorite color
  Request ID: ...
✓ Test memory: Ask about favorite color
  Assistant response contains "blue": ✓
  Response preview: Your favorite color is blue...
  Request ID: ...
✓ Delete conversation
  Request ID: ...

==================================================
Smoke Test Summary
==================================================
✓ Health check
✓ Create conversation
✓ Send message: Remember favorite color
✓ Test memory: Ask about favorite color
✓ Delete conversation

==================================================
Total: 5 | Passed: 5 | Failed: 0
Last Request ID: ...
==================================================

✓ All smoke tests passed!

Stopping dev server...

✓ Smoke test completed successfully!
```

**Exit Codes:**
- `0` - All tests passed
- `1` - One or more tests failed

**Common Failures:**

1. **Environment variables not set**
   ```
   Error: Missing or invalid environment variables: DATABASE_URL, OPENAI_API_KEY
   ```
   **Fix:** Ensure `.env` file exists with `DATABASE_URL` and `OPENAI_API_KEY`

2. **Database connection failed**
   ```
   Health check failed: { ok: true, db: false }
   ```
   **Fix:** Verify `DATABASE_URL` is correct and database is accessible

3. **Server failed to start**
   ```
   Server failed to start after maximum attempts
   ```
   **Fix:** Check if port 3000 is already in use: `lsof -ti:3000 | xargs kill -9`

4. **OpenAI API error**
   ```
   OpenAI API error: ...
   ```
   **Fix:** Verify `OPENAI_API_KEY` is valid and has credits

5. **Memory test failed**
   ```
   Response does not contain "blue"
   ```
   **Fix:** This indicates the AI didn't remember the context - check database connection and message persistence

**Manual Endpoint Testing:**

You can also test endpoints manually:

```bash
# Health check
curl http://localhost:3000/api/health

# Create conversation
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{}'

# List conversations
curl http://localhost:3000/api/conversations

# Get conversation (replace {id} with actual ID)
curl http://localhost:3000/api/conversations/{id}

# Send message (replace {id} with actual ID)
curl -X POST http://localhost:3000/api/conversations/{id}/messages \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Hello!"}'

# Delete conversation (replace {id} with actual ID)
curl -X DELETE http://localhost:3000/api/conversations/{id}

# Clear all conversations
curl -X DELETE http://localhost:3000/api/conversations
```

## 📁 Project Structure

```
chatbot-with-memory/
├── app/
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts          # Health check endpoint
│   │   └── conversations/
│   │       ├── route.ts           # List/Create/Clear conversations
│   │       ├── [id]/
│   │       │   ├── route.ts       # Get/Delete conversation
│   │       │   └── messages/
│   │       │       └── route.ts   # Create message + AI response
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main chat UI
│   └── globals.css                # Global styles
├── lib/
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema definitions
│   │   └── index.ts               # Database connection
│   ├── llm.ts                     # OpenAI wrapper
│   ├── logger.ts                  # Structured logging
│   └── api-helpers.ts              # API utility functions
├── middleware.ts                  # Request ID middleware
├── drizzle/
│   └── 0000_initial.sql           # Initial migration
├── drizzle.config.ts              # Drizzle configuration
└── package.json
```

## 🗄️ Database Schema

### Conversations Table
- `id` (uuid, primary key)
- `title` (text, default: 'New Conversation')
- `created_at` (timestamptz)

### Messages Table
- `id` (uuid, primary key)
- `conversation_id` (uuid, foreign key → conversations.id, cascade delete)
- `role` (text: 'user' | 'assistant')
- `content` (text)
- `created_at` (timestamptz)

**Indexes:**
- `conversations(created_at)` - for sorting
- `messages(conversation_id, created_at)` - for efficient message retrieval

## 🔧 Database Commands

```bash
# Generate migration files from schema changes
npm run db:generate

# Push schema directly to database (dev)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial Next.js setup"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:
   - `DATABASE_URL` - Your Neon PostgreSQL connection string
   - `OPENAI_API_KEY` - Your OpenAI API key
4. Deploy!

### 3. Run Migrations on Vercel

After deployment, run migrations:

```bash
# Set DATABASE_URL in your local environment
export DATABASE_URL="your-neon-connection-string"

# Run migrations
npm run db:migrate
```

Or use Vercel's CLI:

```bash
npm i -g vercel
vercel env pull .env.local
npm run db:migrate
```

## 📝 API Endpoints

### `GET /api/health`
Health check endpoint with database connectivity test.

**Response:**
```json
{
  "status": "healthy",
  "service": "chatbot-api",
  "request_id": "uuid"
}
```

### `POST /api/conversations`
Create a new conversation.

**Request:**
```json
{
  "title": "Optional title"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "New Conversation",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### `GET /api/conversations`
List all conversations with their messages.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "My Conversation",
    "created_at": "2024-01-15T10:30:00Z",
    "messages": [...]
  }
]
```

### `GET /api/conversations/:id`
Get a specific conversation with all messages.

### `POST /api/conversations/:id/messages`
Create a user message and generate an assistant response.

**Request:**
```json
{
  "role": "user",
  "content": "Hello!"
}
```

**Response:**
```json
{
  "id": "uuid",
  "role": "assistant",
  "content": "Hello! How can I help you?",
  "created_at": "2024-01-15T10:30:05Z"
}
```

### `DELETE /api/conversations/:id`
Delete a specific conversation (cascades to messages).

### `DELETE /api/conversations`
Clear all conversations.

## 🔍 Observability

All API requests are logged with structured JSON logs including:
- `request_id` - Unique request identifier (from X-Request-ID header)
- `method` - HTTP method
- `path` - Request path
- `status` - HTTP status code
- `duration_ms` - Request duration in milliseconds
- `error_type` - Error type (if failed)

**Note:** Message content and secrets are never logged.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nick Arndt**
- GitHub: [@nickcarndt](https://github.com/nickcarndt)
- LinkedIn: [Nick Arndt](https://linkedin.com/in/nickarndt)

---

**Note**: This is a portfolio project demonstrating full-stack development with Next.js, TypeScript, and modern cloud databases.
