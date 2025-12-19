# Chatbot with Memory

A full-stack conversational AI application with persistent memory, built with Next.js App Router, TypeScript, and Neon PostgreSQL.

## Features

- Real-time chat interface with polished UI
- Persistent conversation history
- Department Agents: Select from 5 specialized agents (General, Sales, Support, Engineering, Executive)
- OpenAI GPT-3.5-turbo integration with conversation context and agent-specific prompts
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

**Note**: After running `db:push`, if you have existing conversations, you may want to backfill the `agent_id` column:

```bash
tsx scripts/backfill-agent-id.ts
```

This sets `agent_id='general'` for any existing conversations (new conversations default to 'general' automatically).

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

**Important**: 
1. Run `npm run db:push` once against your production database after deployment
2. If you have existing conversations, run `tsx scripts/backfill-agent-id.ts` to set agent_id for existing data

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

## UI Polish Checklist

### Design System Compliance
- **No gradients**: All solid colors (slate/gray + blue accent)
- **Consistent radii**: `rounded-lg` (containers), `rounded-md` (inputs/buttons), `rounded-full` (badges)
- **Subtle shadows**: Only `shadow-sm`
- **Typography**: `text-lg/semibold` (headings), `text-sm` (body), `text-slate-500` (muted)
- **Focus rings**: `focus:ring-2 focus:ring-blue-500` on all interactive elements

### Features
- **Eval Mode**: Toggle in chat header to view agent system prompt and conversation details
- **Response Details**: Collapsible details per assistant message (duration, agent, request_id)
- **Command Palette**: Press `Cmd+K` / `Ctrl+K` for quick actions
- **Sidebar Search**: Filter conversations by title
- **Agent Filters**: Filter conversations by agent type
- **Mobile**: Sidebar hidden on mobile (responsive layout)

### Quick Visual Test
1. Sidebar: Dark (`bg-slate-950`), clean, professional
2. Empty state: Centered, minimal, clear CTA
3. Messages: Clean bubbles (`max-w-[72ch]`), good spacing
4. Composer: Sticky bottom, clean input, focus states
5. Overall: Enterprise SaaS aesthetic (Linear/Vercel/Stripe-like)

## License

MIT
