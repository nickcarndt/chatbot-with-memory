import { NextRequest, NextResponse } from 'next/server';
import { withLogging, getRequestId } from '@/lib/api-helpers';
import { validateUuid } from '@/lib/validators';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withLogging(request, async () => {
    const requestId = getRequestId(request);

    // Validate UUID
    const uuidValidation = validateUuid(params.id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: uuidValidation.error,
            request_id: requestId,
          },
        },
        { status: 400 }
      );
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, params.id))
      .limit(1);

    if (!conversation) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found',
            request_id: requestId,
          },
        },
        { status: 404 }
      );
    }

    const convMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.id))
      .orderBy(messages.createdAt);

    return NextResponse.json({
      ...conversation,
      messages: convMessages,
    });
  }, 'get_conversation');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withLogging(request, async () => {
    const requestId = getRequestId(request);

    // Validate UUID
    const uuidValidation = validateUuid(params.id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: uuidValidation.error,
            request_id: requestId,
          },
        },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(conversations)
      .where(eq(conversations.id, params.id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found',
            request_id: requestId,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Conversation deleted' });
  }, 'delete_conversation');
}
