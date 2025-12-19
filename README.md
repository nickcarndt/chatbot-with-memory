# Chatbot with Memory

A full-stack conversational AI application with persistent memory, built with Next.js App Router, TypeScript, and Neon PostgreSQL.

## Features

- Real-time chat interface
- Persistent conversation history
- OpenAI GPT-3.5-turbo integration with conversation context
- Structured logging with request ID tracing

## Tech Stack

- **Framework**: Next.js 14.2+ (App Router)
- **Language**: TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-3.5-turbo
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- Neon PostgreSQL database ([neon.tech](https://neon.tech))
- OpenAI API key

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=REDACTEDser:password@host.neon.tech/dbname?sslmode=require
OPENAI_API_KEY=REDACTED
NODE_ENV=development
```

### 3. Run Database Migrations

```bash
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Smoke Test

```bash
npm run smoke
```

Tests: health check, conversation creation, message memory, cleanup.

## Deployment to Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables:
   - `DATABASE_URL` (Neon connection string)
   - `OPENAI_API_KEY` (OpenAI API key)
4. Deploy

**Important**: Run `npm run db:push` once against your production database after deployment.

## API Endpoints

- `GET /api/health` - Health check with DB connectivity
- `POST /api/conversations` - Create conversation
- `GET /api/conversations` - List all conversations
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/conversations/:id/messages` - Send message + get AI response
- `DELETE /api/conversations/:id` - Delete conversation
- `DELETE /api/conversations` - Clear all conversations

All responses include `X-Request-ID` header for tracing.

## Error Format

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request",
    "request_id": "uuid"
  }
}
```

## Security Hygiene

### Verify No Secrets in Code

Before committing, run:

```bash
npm run verify:secrets
```

This scans tracked files for accidental secret commits (API keys, database URLs, etc.) and fails if any are found.

### Environment Variables

- **Never commit `.env` files** - they are gitignored
- **Use `.env.example`** for documentation only (placeholders only)
- **Vercel deployment**: Add `DATABASE_URL` and `OPENAI_API_KEY` in Vercel dashboard

## License

MIT
