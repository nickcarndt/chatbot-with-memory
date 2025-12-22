/**
 * API helper functions for request handling and logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { logInfo, logError } from './logger';
import { MAX_BODY_SIZE } from './validators';

export function getRequestId(request: NextRequest): string {
  return request.headers.get('X-Request-ID') || 'unknown';
}

/**
 * Parse and validate request body size
 */
export async function parseBody<T>(request: NextRequest): Promise<T> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    throw new Error('Request body too large');
  }

  const text = await request.text();
  if (text.length > MAX_BODY_SIZE) {
    throw new Error('Request body too large');
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error('Invalid JSON');
  }
}

/**
 * Log request start/end with timing
 */
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
    let status = 200;
    if (result instanceof Response) {
      status = result.status;
    }

    logInfo(`${eventName}_completed`, {
      request_id: requestId,
      method,
      path,
      status,
      duration_ms: durationMs,
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;

    logError(`${eventName}_failed`, {
      request_id: requestId,
      method,
      path,
      status: 500,
      duration_ms: durationMs,
      error: error instanceof Error ? error : new Error(String(error)),
      error_stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}
