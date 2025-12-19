# Chatbot with Memory

A production-ready conversational AI application with persistent memory, built with Next.js, TypeScript, and Neon PostgreSQL.

![Demo](public/demo.png)

## Quickstart

### 1. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=REDACTEDser:password@host.neon.tech/dbname?sslmode=require
OPENAI_API_KEY=REDACTED
NODE_ENV=development
```

### 2. Database Setup

```bash
npm install
npm run db:push
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Department Agents**: 5 specialized agents (General, Sales, Support, Engineering, Executive) with custom system prompts
- **Inspector**: Debug panel showing request metadata (duration, request ID, model, token usage)
- **Request ID Tracing**: Every API request includes `X-Request-ID` header for log correlation
- **Persistent Memory**: Conversation history and message metadata stored in PostgreSQL
- **Enterprise UI**: Clean, modern interface with command palette (Cmd+K), search, and filters

## Why This Matters

**Department Agents** → Prompt routing for org roles. Each agent uses a specialized system prompt optimized for their domain (sales discovery, support troubleshooting, engineering tradeoffs).

**Inspector** → Debuggability + request_id correlation. Every assistant response includes metadata (duration, model, tokens) that can be traced back to Vercel logs via `request_id` for production debugging.

**Metadata Persistence** → Post-hoc analysis, cost + latency visibility. All message metadata is stored in PostgreSQL, enabling analysis of token usage, response times, and model performance over time.

## 90-Second Demo Script

1. Select agent (e.g., "Engineering") → Click "New Chat"
2. Ask a question (e.g., "Explain React hooks")
3. Click ⓘ icon on assistant response to open Inspector
4. View metadata: duration, request ID, model, token usage
5. Correlate with Vercel logs using `request_id` from Inspector

## Operations

### Vercel Deployment

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables:
   - `DATABASE_URL` (Neon connection string)
   - `OPENAI_API_KEY` (OpenAI API key)
4. Deploy

### Database Migrations

After deployment, apply schema changes to production:

```bash
vercel env pull .env.production.local --environment=production
export $(grep "^DATABASE_URL=" .env.production.local | xargs)
npm run db:push
```

### Logs

- **Vercel Logs**: Dashboard → Project → Logs
- **Request Tracing**: Search by `request_id` from `X-Request-ID` header
- **Structured Logs**: JSON format with `request_id`, `method`, `path`, `status`, `duration_ms`

## Development

```bash
npm run typecheck  # TypeScript validation
npm run lint       # ESLint
npm run build      # Production build
npm run smoke      # End-to-end smoke tests
```

### Commit Style

Follow conventional commits:
- `feat(ui):` - UI features
- `fix(ui):` - UI bug fixes
- `chore(ui):` - UI maintenance
- `feat:` - Backend/API features
- `fix:` - Backend/API bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks

## API

- `GET /api/health` - Health check with DB connectivity
- `POST /api/conversations` - Create conversation (optional `agent_id`)
- `GET /api/conversations` - List all conversations
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/conversations/:id/messages` - Send message + get AI response
- `DELETE /api/conversations/:id` - Delete conversation
- `DELETE /api/conversations` - Clear all conversations

All responses include `X-Request-ID` header.

## Security

```bash
npm run verify:secrets  # Scan for accidental secret commits
```

Never commit `.env` files. Use `.env.example` for documentation only.

## Tech Stack

- **Framework**: Next.js 14.2+ (App Router, TypeScript)
- **Database**: Neon PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-3.5-turbo
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## License

MIT
