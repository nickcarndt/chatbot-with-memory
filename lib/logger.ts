interface LogContext {
  request_id?: string;
  [key: string]: unknown;
}

export function logInfo(event: string, context: LogContext = {}) {
  const log = {
    level: 'info',
    event,
    timestamp: new Date().toISOString(),
    ...context,
  };
  console.log(JSON.stringify(log));
}

export function logError(event: string, context: LogContext = {}) {
  const log = {
    level: 'error',
    event,
    timestamp: new Date().toISOString(),
    ...context,
  };
  console.error(JSON.stringify(log));
}
