/**
 * Structured logging with secret stripping
 * Never logs message content, PII, or secrets
 */

interface LogContext {
  request_id?: string;
  [key: string]: unknown;
}

// Patterns that indicate secrets (case-insensitive)
const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /token/i,
  /secret/i,
  /password/i,
  /auth/i,
  /credential/i,
  /sk-[a-z0-9]+/i, // OpenAI API key pattern
];

function stripSecrets(obj: unknown, path = ''): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Check if the key name suggests a secret
    if (SECRET_PATTERNS.some(pattern => pattern.test(path))) {
      return '[REDACTED]';
    }
    // Check if the value looks like a secret
    if (SECRET_PATTERNS.some(pattern => pattern.test(obj))) {
      return '[REDACTED]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => stripSecrets(item, `${path}[${index}]`));
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      cleaned[key] = stripSecrets(value, newPath);
    }
    return cleaned;
  }

  return obj;
}

export function logInfo(event: string, context: LogContext = {}) {
  const cleaned = stripSecrets(context);
  const log: Record<string, unknown> = {
    level: 'info',
    event,
    timestamp: new Date().toISOString(),
  };
  
  if (cleaned && typeof cleaned === 'object') {
    Object.assign(log, cleaned);
  }
  
  console.log(JSON.stringify(log));
}

export function logError(event: string, context: LogContext = {}) {
  const cleanedContext = stripSecrets(context);
  
  const log: Record<string, unknown> = {
    level: 'error',
    event,
    timestamp: new Date().toISOString(),
  };
  
  if (cleanedContext && typeof cleanedContext === 'object') {
    Object.assign(log, cleanedContext);
  }

  // Add stack trace server-side only (not in browser)
  if (typeof window === 'undefined' && context.error instanceof Error) {
    log.error_name = context.error.name;
    log.error_message = context.error.message;
    log.error_stack = context.error.stack;
  }

  console.error(JSON.stringify(log));
}
