import { NextRequest, NextResponse } from 'next/server';
import { withLogging, getRequestId } from '@/lib/api-helpers';
import { getEnv } from '@/lib/env';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return withLogging(request, async () => {
    const requestId = getRequestId(request);

    // Validate environment
    try {
      getEnv();
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          db: false,
          error: 'Environment validation failed',
          request_id: requestId,
        },
        { status: 503 }
      );
    }

    // Test database connection
    let dbOk = false;
    try {
      // Simple query to test connection
      await db.select().from(conversations).limit(0);
      dbOk = true;
    } catch (error) {
      dbOk = false;
    }

    return NextResponse.json({
      ok: true,
      db: dbOk,
      request_id: requestId,
    });
  }, 'health_check');
}
