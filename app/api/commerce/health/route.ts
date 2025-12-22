import { NextRequest, NextResponse } from 'next/server';
import { withLogging, getRequestId } from '@/lib/api-helpers';
import { mcpToolsList } from '@/lib/mcp';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return withLogging(request, async () => {
    const requestId = request.headers.get('x-request-id') ?? randomUUID();

    const featureEnabled = process.env.COMMERCE_ENABLED === 'true';

    if (!featureEnabled) {
      const response = NextResponse.json(
        {
          ok: false,
          disabled: true,
        },
        { status: 200 }
      );
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    try {
      await mcpToolsList();
      const response = NextResponse.json(
        {
          ok: true,
          mcp: true,
        },
        { status: 200 }
      );
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('Cache-Control', 'no-store');
      return response;
    } catch (error: any) {
      const response = NextResponse.json(
        {
          ok: false,
          mcp: false,
          error: error?.message || 'MCP connection failed',
        },
        { status: 200 }
      );
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }
  }, 'commerce_health');
}

