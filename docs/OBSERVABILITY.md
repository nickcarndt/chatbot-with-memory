# Observability Guide

This document describes the observability features implemented in the Chatbot with Memory backend.

## Overview

The application uses structured JSON logging with request ID tracing for production-grade observability. All logs are structured as JSON in production and human-readable in development.

## Request ID Tracing

Every request is assigned a unique `X-Request-ID` that:
- Is read from the request header if provided, or auto-generated as a UUID
- Is stored in `request.state.request_id` for use throughout the request lifecycle
- Is included in all response headers as `X-Request-ID`
- Is included in all log entries for that request

### Using Request IDs

**In API calls:**
```bash
# Include X-Request-ID in your request
curl -H "X-Request-ID: my-custom-id" http://localhost:8000/api/v1/conversations/
```

**In logs:**
All log entries include `request_id` field, allowing you to trace a single request through the entire system.

## Log Fields

### Request Logs

**Request Started:**
```json
{
  "event": "request_started",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/v1/conversations/1/messages",
  "query_params": null,
  "timestamp": "2024-01-15T10:30:00.123456Z",
  "logger": "app.core.middleware",
  "level": "info"
}
```

**Request Completed:**
```json
{
  "event": "request_completed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/v1/conversations/1/messages",
  "status_code": 200,
  "duration_ms": 1234.56,
  "timestamp": "2024-01-15T10:30:00.234567Z",
  "logger": "app.core.middleware",
  "level": "info"
}
```

**Request Failed:**
```json
{
  "event": "request_failed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/v1/conversations/1/messages",
  "duration_ms": 500.12,
  "error_type": "HTTPException",
  "error_message": "Conversation not found",
  "timestamp": "2024-01-15T10:30:00.345678Z",
  "logger": "app.core.middleware",
  "level": "error"
}
```

### OpenAI Integration Logs

**Successful OpenAI Request:**
```json
{
  "event": "openai_request_success",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_id": 1,
  "model": "gpt-3.5-turbo",
  "duration_ms": 1234.56,
  "message_count": 5,
  "timestamp": "2024-01-15T10:30:00.456789Z",
  "logger": "app.services.openai_service",
  "level": "info"
}
```

**Failed OpenAI Request:**
```json
{
  "event": "openai_request_failed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_id": 1,
  "model": "gpt-3.5-turbo",
  "duration_ms": 500.12,
  "error_type": "APIError",
  "message_count": 5,
  "timestamp": "2024-01-15T10:30:00.567890Z",
  "logger": "app.services.openai_service",
  "level": "error"
}
```

**Note:** OpenAI logs do NOT include message content or any secrets for security and privacy.

### Exception Logs

**Unhandled Exception:**
```json
{
  "event": "unhandled_exception",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/v1/conversations/1/messages",
  "error_type": "ValueError",
  "error_message": "Invalid input",
  "timestamp": "2024-01-15T10:30:00.678901Z",
  "logger": "app.main",
  "level": "error",
  "exception": "..."
}
```

## Grepping Logs by Request ID

### Using grep (local development)
```bash
# Find all logs for a specific request
grep "550e8400-e29b-41d4-a716-446655440000" logs/app.log

# Find all logs for a request with JSON parsing
grep "550e8400-e29b-41d4-a716-446655440000" logs/app.log | jq .
```

### Using Cloud Logging (GCP)
```bash
# Query logs by request_id
gcloud logging read "jsonPayload.request_id='550e8400-e29b-41d4-a716-446655440000'" --limit 50

# Query logs with JSON format
gcloud logging read "jsonPayload.request_id='550e8400-e29b-41d4-a716-446655440000'" --format json | jq .
```

### Using jq for JSON logs
```bash
# Filter logs by request_id
cat logs/app.log | jq 'select(.request_id == "550e8400-e29b-41d4-a716-446655440000")'

# Get all request IDs from logs
cat logs/app.log | jq -r '.request_id' | sort -u

# Find slow requests (>1000ms)
cat logs/app.log | jq 'select(.duration_ms > 1000)'
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL). Default: `INFO`
- `ENV`: Environment name (`development` or `production`). Default: `development`
  - `development`: Human-readable console output
  - `production`: JSON formatted logs

### Example Configuration

```bash
# Development
LOG_LEVEL=DEBUG
ENV=development

# Production
LOG_LEVEL=INFO
ENV=production
```

## Log Levels

- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages (request start/end, successful operations)
- **WARNING**: Warning messages (not errors, but may indicate issues)
- **ERROR**: Error messages (failed operations, exceptions)
- **CRITICAL**: Critical errors that may cause application failure

## Best Practices

1. **Always include request_id** in custom log statements:
   ```python
   logger.info("custom_event", request_id=request.state.request_id, ...)
   ```

2. **Use structured logging** - always pass fields as keyword arguments:
   ```python
   # Good
   logger.info("event_name", field1=value1, field2=value2)
   
   # Bad
   logger.info(f"event_name: {value1}, {value2}")
   ```

3. **Never log secrets** - API keys, tokens, or sensitive user data should never appear in logs

4. **Use appropriate log levels** - INFO for normal operations, ERROR for failures

5. **Include context** - Add relevant context fields (conversation_id, user_id, etc.) when available

## Troubleshooting

### No logs appearing
- Check `LOG_LEVEL` environment variable
- Verify logging configuration is called during app startup
- Check that logs are being written to stdout/stderr

### Request IDs not appearing
- Ensure `RequestIDMiddleware` is added before other middleware
- Check that `request.state.request_id` is being accessed correctly

### JSON logs not formatted correctly
- Verify `ENV=production` is set
- Check that structlog processors are configured correctly
