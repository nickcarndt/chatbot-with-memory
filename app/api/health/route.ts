import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withLogging, getRequestId } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return withLogging(request, async () => {
    // Validate environment
    try {
      getEnv();
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          db: false,
          error: 'Environment validation failed',
        },
        { status: 503 }
      );
    }

    // Test database connection
    let dbOk = false;
    try {
      await db.execute({ sql: 'SELECT 1', args: [] });
      dbOk = true;
    } catch (error) {
      dbOk = false;
    }

    return NextResponse.json({
      ok: true,
      db: dbOk,
      request_id: getRequestId(request),
    });
  }, 'health_check');
}
