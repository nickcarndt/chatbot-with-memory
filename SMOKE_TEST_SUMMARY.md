# Smoke Test Implementation Summary

## Changes Made

### 1. Environment Validation (`lib/env.ts`) - NEW FILE

**Purpose:** Fail-fast validation of required environment variables using Zod.

**Features:**
- Validates `DATABASE_URL` (required, non-empty)
- Validates `OPENAI_API_KEY` (required, must start with `sk-`)
- Validates `NODE_ENV` (optional, defaults to 'development')
- Throws clear error messages (no secrets printed)
- Validates on module import (server-side only)

**Usage:** Imported automatically by `lib/db/index.ts` and `lib/llm.ts`, so all API routes get validation.

### 2. Updated Health Endpoint (`app/api/health/route.ts`)

**Changes:**
- Now returns `{ ok: true, db: true }` format (matches smoke test expectations)
- Includes environment validation check
- Still includes `request_id` for debugging

**Response Format:**
```json
{
  "ok": true,
  "db": true,
  "request_id": "uuid"
}
```

### 3. Smoke Test Script (`scripts/smoke.ts`) - NEW FILE

**Tests:**
1. ✅ Health check - validates `{ ok: true, db: true }`
2. ✅ Create conversation - captures conversation ID
3. ✅ Send memory message - "Remember my favorite color is blue"
4. ✅ Test memory - "What is my favorite color?" (asserts response contains "blue")
5. ✅ Cleanup - deletes conversation

**Features:**
- Prints concise PASS/FAIL summary
- Shows request IDs for debugging
- Exits with code 0 (success) or 1 (failure)
- Does NOT log message content in server logs (only in smoke script output)

### 4. Smoke Test Runner (`scripts/smoke-runner.ts`) - NEW FILE

**Purpose:** Orchestrates the full smoke test flow.

**Flow:**
1. Starts Next.js dev server in background
2. Waits for `/api/health` to be reachable (max 60 attempts, 1s delay)
3. Runs smoke test script
4. Shuts down dev server cleanly (SIGTERM, then SIGKILL if needed)

**Features:**
- Handles server lifecycle automatically
- Clean shutdown on success or failure
- Proper error handling and cleanup

### 5. Updated Package.json

**New Dependencies:**
- `zod: ^3.22.4` - Environment validation
- `tsx: ^4.7.0` - TypeScript execution for scripts

**New Scripts:**
- `npm run smoke` - Full smoke test (starts server, runs tests, stops server)
- `npm run smoke:test` - Run smoke tests only (assumes server is running)

### 6. Updated README.md

**New Section:** "🧪 Smoke Test"
- Exact command: `npm run smoke`
- Expected output with examples
- Common failures and fixes
- Manual endpoint testing commands

## File-by-File Diffs

### New Files

```
lib/env.ts                          # Environment validation with Zod
scripts/smoke.ts                    # Smoke test script
scripts/smoke-runner.ts             # Smoke test orchestrator
scripts/wait-for-server.js          # Health check waiter (unused, kept for reference)
```

### Modified Files

```
app/api/health/route.ts             # Updated to return { ok, db } format
lib/db/index.ts                    # Uses getEnv() for validation
lib/llm.ts                          # Uses getEnv() for validation
package.json                        # Added zod, tsx, smoke scripts
README.md                           # Added smoke test section
```

## Usage

### Run Full Smoke Test

```bash
npm run smoke
```

This will:
1. Start dev server
2. Wait for health endpoint
3. Run all tests
4. Shut down server
5. Exit with 0 (success) or 1 (failure)

### Run Smoke Test Only (Server Already Running)

```bash
npm run smoke:test
```

## Expected Output

```
Starting Next.js dev server...
Waiting for server to be ready...
Server is ready!

Starting smoke test...

✓ Health check
  Request ID: abc-123-def-456
✓ Create conversation
  Conversation ID: 550e8400-e29b-41d4-a716-446655440000
  Request ID: xyz-789-ghi-012
✓ Send message: Remember favorite color
  Request ID: ...
✓ Test memory: Ask about favorite color
  Assistant response contains "blue": ✓
  Response preview: Your favorite color is blue. I'll remember that for you...
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

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

## Environment Validation

The app now validates environment variables at startup:

**Required:**
- `DATABASE_URL` - Must be non-empty PostgreSQL connection string
- `OPENAI_API_KEY` - Must start with `sk-`

**Optional:**
- `NODE_ENV` - Defaults to 'development'

**Error Message Example:**
```
Error: Missing or invalid environment variables: DATABASE_URL, OPENAI_API_KEY
```

No secrets are printed in error messages.

## Testing Checklist

- [x] Environment validation on startup
- [x] Health endpoint returns `{ ok, db }` format
- [x] Smoke test creates conversation
- [x] Smoke test sends message with memory
- [x] Smoke test validates memory retention
- [x] Smoke test cleans up
- [x] Request IDs displayed in output
- [x] Server starts/stops automatically
- [x] Exit codes correct (0/1)
- [x] No message content in server logs
- [x] README updated with instructions
