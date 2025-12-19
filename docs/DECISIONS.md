# Technical Decisions

**Stack:** Next.js App Router (TS), Neon Postgres, Drizzle ORM, OpenAI API, Vercel

**Key Decisions:**
- Request ID middleware for log correlation
- Inspector drawer for request metadata (duration, model, tokens)
- Department agents with system prompts per conversation
- Persisted metadata in `messages.meta` JSONB
- Markdown rendering (GFM + sanitization)
