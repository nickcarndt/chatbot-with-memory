import { NextRequest } from 'next/server';
import { logInfo, logError } from './logger';

export function getRequestId(request: NextRequest): string {
  return request.headers.get('X-Request-ID') || 'unknown';
}

export async function withLogging<T>(
  request: NextRequest,
  handler: () => Promise<T>,
  eventName: string
): Promise<T> {
  const requestId = getRequestId(request);
  const method = request.method;
  const path = request.nextUrl.pathname;
  const startTime = Date.now();

  logInfo(`${eventName}_started`, {
    request_id: requestId,
    method,
    path,
  });

  try {
    const result = await handler();
    const durationMs = Date.now() - startTime;

    logInfo(`${eventName}_completed`, {
      request_id: requestId,
      method,
      path,
      status: 200,
      duration_ms: durationMs,
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
    const errorMessage = error instanceof Error ? error.message : String(error);

    logError(`${eventName}_failed`, {
      request_id: requestId,
      method,
      path,
      duration_ms: durationMs,
      error_type: errorType,
      error_message: errorMessage,
    });

    throw error;
  }
}
