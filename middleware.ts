import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export function middleware(request: NextRequest) {
  // Get or generate request ID
  let requestId = request.headers.get('X-Request-ID');
  if (!requestId) {
    requestId = uuidv4();
  }

  // Create new request headers with request ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-Request-ID', requestId);

  // Create response with request ID in headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add request ID to response header
  response.headers.set('X-Request-ID', requestId);

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
