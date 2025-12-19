import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withLogging, getRequestId } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return withLogging(request, async () => {
    try {
      // Simple DB check
      await db.execute({ sql: 'SELECT 1', args: [] });
      
      return NextResponse.json({
        status: 'healthy',
        service: 'chatbot-api',
        request_id: getRequestId(request),
      });
    } catch (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          service: 'chatbot-api',
          error: 'Database connection failed',
          request_id: getRequestId(request),
        },
        { status: 503 }
      );
    }
  }, 'health_check');
}
