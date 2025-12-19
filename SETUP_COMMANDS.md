# Setup Commands - Exact Steps

## Prerequisites Check

```bash
# Check Node.js version (need 18+)
node --version

# Check npm version
npm --version
```

## Step 1: Install Dependencies

```bash
cd /Users/nickarndt/Code/chatbot-with-memory
npm install
```

**Expected output:** Dependencies installed (Next.js, Drizzle, Neon, OpenAI, etc.)

## Step 2: Set Up Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env file (use your editor)
# Add your Neon DATABASE_URL and OPENAI_API_KEY
```

**Required variables:**
```env
DATABASE_URL=REDACTEDser:password@host.neon.tech/dbname?sslmode=require
OPENAI_API_KEY=REDACTED
NODE_ENV=development
```

## Step 3: Get Neon Database URL

1. Go to https://neon.tech
2. Sign up / Log in
3. Create a new project
4. Copy the connection string (looks like: `postgresql://REDACTEDser:pass@host.neon.tech/dbname?sslmode=require`)
5. Paste into `.env` as `DATABASE_URL`

## Step 4: Run Database Migrations

```bash
# Option 1: Push schema directly (recommended for development)
npm run db:push

# Option 2: Generate and run migrations (for production)
npm run db:generate
npm run db:migrate
```

**Expected output:**
- Schema pushed/created successfully
- Tables: `conversations`, `messages`
- Indexes created

## Step 5: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- info Loaded env from .env
```

## Step 6: Smoke Test Endpoints

Open a new terminal and run:

```bash
# 1. Health check
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","service":"chatbot-api","request_id":"..."}

# 2. Create conversation
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# {"id":"uuid","title":"New Conversation","created_at":"..."}

# 3. List conversations (save the ID from step 2)
curl http://localhost:3000/api/conversations

# 4. Send message (replace {id} with actual ID from step 2)
curl -X POST http://localhost:3000/api/conversations/{id}/messages \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Hello!"}'

# Expected response:
# {"id":"uuid","role":"assistant","content":"...","created_at":"..."}

# 5. Get conversation with messages
curl http://localhost:3000/api/conversations/{id}

# 6. Delete conversation
curl -X DELETE http://localhost:3000/api/conversations/{id}

# 7. Clear all conversations
curl -X DELETE http://localhost:3000/api/conversations
```

## Step 7: Test UI

1. Open browser: http://localhost:3000
2. Click "Start New Chat" or "+ New Chat"
3. Type a message and send
4. Verify AI response appears
5. Refresh page - conversation should persist
6. Create multiple conversations
7. Test sidebar navigation
8. Test delete conversation
9. Test "Clear All"

## Step 8: Verify Logging

Check terminal running `npm run dev` for structured JSON logs:

```json
{"level":"info","event":"health_check_started","request_id":"...","method":"GET","path":"/api/health","timestamp":"..."}
{"level":"info","event":"health_check_completed","request_id":"...","method":"GET","path":"/api/health","status":200,"duration_ms":45,"timestamp":"..."}
```

## Troubleshooting

### Database Connection Error
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL  # Should show your Neon connection string

# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"
```

### OpenAI API Error
```bash
# Verify API key is set
echo $OPENAI_API_KEY  # Should show your key (starts with sk-)

# Test in .env file
cat .env | grep OPENAI_API_KEY
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Migration Errors
```bash
# Reset database (WARNING: deletes all data)
# In Neon dashboard: Settings → Delete Project → Create New

# Or drop tables manually
psql $DATABASE_URL -c "DROP TABLE IF EXISTS messages; DROP TABLE IF EXISTS conversations;"

# Then re-run migration
npm run db:push
```

## Production Deployment (Vercel)

### 1. Push to GitHub
```bash
git add .
git commit -m "Migrate to Next.js"
git push origin main
```

### 2. Deploy on Vercel
1. Go to https://vercel.com
2. Import GitHub repository
3. Add environment variables:
   - `DATABASE_URL` = Your Neon connection string
   - `OPENAI_API_KEY` = Your OpenAI key
4. Deploy

### 3. Run Migrations on Production
```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull .env.local

# Run migrations
npm run db:migrate
```

## Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:push          # Push schema (dev)
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio GUI
```

## File Structure Reference

```
chatbot-with-memory/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   ├── page.tsx           # Main UI
│   └── layout.tsx         # Root layout
├── lib/                    # Shared libraries
│   ├── db/                # Database (Drizzle + Neon)
│   ├── llm.ts             # OpenAI wrapper
│   └── logger.ts          # Logging
├── middleware.ts           # Request ID middleware
├── drizzle/               # Migration files
└── package.json           # Dependencies
```
