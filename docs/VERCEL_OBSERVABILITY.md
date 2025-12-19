# Vercel Observability & Log Inspection Guide

This guide shows you how to inspect logs, monitor deployments, and trace requests in your Vercel deployment.

## Prerequisites

1. **Vercel CLI installed:**
   ```bash
   npm i -g vercel
   ```

2. **Authenticated with Vercel:**
   ```bash
   vercel login
   ```

3. **Linked to your project:**
   ```bash
   cd /path/to/chatbot-with-memory
   vercel link
   ```

## Quick Commands

### View Recent Logs
```bash
# Stream live logs
npm run vercel:logs

# JSON format (for parsing)
npm run vercel:logs:json

# Last 100 logs
vercel logs --limit 100
```

### List Deployments
```bash
npm run vercel:deployments

# Or
vercel ls
```

### Inspect Logs (Advanced)
```bash
# Show all commands
npm run vercel:inspect

# View logs with filters
npm run vercel:inspect logs --request-id=abc-123
npm run vercel:inspect logs --event=request_completed
npm run vercel:inspect logs --limit=50

# Trace a specific request
npm run vercel:inspect trace <request-id>

# Show statistics
npm run vercel:inspect stats
```

## Structured Log Format

Our application logs structured JSON with the following fields:

### Request Logs
```json
{
  "level": "info",
  "event": "request_completed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/conversations/123/messages",
  "status": 200,
  "duration_ms": 1234.56,
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

### OpenAI Logs
```json
{
  "level": "info",
  "event": "openai_request_success",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_id": "123",
  "model": "gpt-3.5-turbo",
  "duration_ms": 1234.56,
  "message_count": 5,
  "timestamp": "2024-01-15T10:30:00.456Z"
}
```

### Error Logs
```json
{
  "level": "error",
  "event": "openai_request_failed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "error_type": "APIError",
  "error_message": "Rate limit exceeded",
  "timestamp": "2024-01-15T10:30:00.789Z"
}
```

## Tracing Requests

### Find Request ID
Every API response includes an `X-Request-ID` header. You can also find it in logs:

```bash
# Search for a specific request ID
vercel logs --output json | grep "request_id.*abc-123"
```

### Trace Full Request Flow
```bash
# Using the inspection script
npm run vercel:inspect trace abc-123-def-456
```

This will show:
- Request started
- Database operations
- OpenAI API calls
- Request completed
- Any errors

## Common Use Cases

### 1. Debug a Failed Request

```bash
# Get the request ID from the error response
# Then trace it
npm run vercel:inspect trace <request-id>
```

### 2. Monitor API Performance

```bash
# Filter for request_completed events
npm run vercel:inspect logs --event=request_completed --limit=100

# Look for slow requests (duration_ms > 1000)
vercel logs --output json | jq 'select(.duration_ms > 1000)'
```

### 3. Check OpenAI API Health

```bash
# Filter for OpenAI events
npm run vercel:inspect logs --event=openai_request_success
npm run vercel:inspect logs --event=openai_request_failed
```

### 4. Monitor Error Rates

```bash
# Count errors
vercel logs --output json | jq 'select(.level == "error")' | wc -l

# Group by error type
vercel logs --output json | jq -r 'select(.level == "error") | .error_type' | sort | uniq -c
```

### 5. View Recent Activity

```bash
# Last 50 logs
vercel logs --limit 50

# Last hour
vercel logs --since 1h

# Specific deployment
vercel logs <deployment-url>
```

## Vercel Dashboard

You can also view logs in the Vercel dashboard:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on a deployment
4. Go to **"Functions"** tab
5. Click on a function to see logs
6. Use the search/filter to find specific logs

## Advanced Filtering with jq

If you have `jq` installed, you can do powerful filtering:

```bash
# Get all request IDs
vercel logs --output json | jq -r '.request_id' | sort -u

# Find slow requests
vercel logs --output json | jq 'select(.duration_ms > 2000)'

# Group by event type
vercel logs --output json | jq -r '.event' | sort | uniq -c

# Find errors with request IDs
vercel logs --output json | jq 'select(.level == "error") | {request_id, error_type, error_message}'

# Average response time
vercel logs --output json | jq '[select(.event == "request_completed") | .duration_ms] | add / length'
```

## Real-time Monitoring

### Stream Live Logs
```bash
# Watch logs in real-time
vercel logs --follow

# Filter while watching
vercel logs --follow | grep "error"
```

### Set Up Alerts

In Vercel dashboard:
1. Go to **Settings** → **Monitoring**
2. Set up alerts for:
   - High error rates
   - Slow response times
   - Function timeouts

## Log Retention

- **Vercel Hobby:** 7 days
- **Vercel Pro:** 30 days
- **Vercel Enterprise:** Custom

For longer retention, consider:
- Exporting logs to external service
- Using Vercel's log drain feature
- Setting up external monitoring (Datadog, LogRocket, etc.)

## Troubleshooting

### No Logs Appearing
- Check that environment variables are set
- Verify the deployment is active
- Check function execution in Vercel dashboard

### Can't Find Request ID
- Check response headers: `curl -I https://your-app.vercel.app/api/health`
- Look in browser DevTools Network tab
- Check server logs for the request

### Logs Not Structured
- Verify `lib/logger.ts` is using JSON format
- Check that `NODE_ENV=production` is set
- Ensure structured logging is enabled

## Example Workflow

```bash
# 1. Check recent deployments
npm run vercel:deployments

# 2. View recent logs
npm run vercel:logs --limit 50

# 3. Find a specific request
npm run vercel:inspect trace abc-123-def-456

# 4. Check for errors
vercel logs --output json | jq 'select(.level == "error")'

# 5. Monitor performance
vercel logs --output json | jq 'select(.event == "request_completed") | .duration_ms' | awk '{sum+=$1; count++} END {print "Average:", sum/count, "ms"}'
```

## Additional Resources

- [Vercel Logs Documentation](https://vercel.com/docs/monitoring/logs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Structured Logging Best Practices](https://vercel.com/docs/monitoring/logs#structured-logging)
