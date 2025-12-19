# Technical Decisions

## Stack

- **Next.js App Router (TypeScript)** — Server-side rendering, API routes, type safety
- **Neon Postgres** — Serverless PostgreSQL with connection pooling
- **Drizzle ORM** — Type-safe queries, migrations, schema management
- **OpenAI API** — GPT-3.5-turbo for conversational AI
- **Vercel** — Deployment platform (serverless functions, edge middleware)

## Key Design Decisions

- **Request ID Middleware** — Every request gets `X-Request-ID` header for log correlation
- **Inspector Drawer** — UI for viewing request metadata (duration, model, tokens) without cluttering chat
- **Department Agents** — System prompts stored per conversation for specialized responses
- **Persisted Metadata** — Message metadata in `messages.meta` JSONB for post-hoc analysis
- **Markdown Rendering** — GFM support with HTML sanitization for assistant messages

## Why Not

- **No pgvector** — Not using vector embeddings
- **No LlamaIndex** — Direct OpenAI API calls
- **No Docker** — Vercel handles deployment
- **No Cloud Run** — Vercel serverless instead
