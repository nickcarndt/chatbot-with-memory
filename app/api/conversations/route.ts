import { NextRequest, NextResponse } from 'next/server';
import { withLogging, parseBody, getRequestId } from '@/lib/api-helpers';
import { createConversationSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withLogging(request, async () => {
    const requestId = getRequestId(request);

    // Parse and validate body
    let body: unknown;
    try {
      body = await parseBody(request);
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: error instanceof Error ? error.message : 'Invalid request body',
            request_id: requestId,
          },
        },
        { status: 400 }
      );
    }

    // Validate schema
    const validation = createConversationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: validation.error.errors[0]?.message || 'Invalid request',
            request_id: requestId,
          },
        },
        { status: 400 }
      );
    }

    const [newConversation] = await db
      .insert(conversations)
      .values({ 
        title: validation.data.title || 'New Conversation',
        agentId: validation.data.agent_id || 'general',
      })
      .returning();

    return NextResponse.json(newConversation, { status: 201 });
  }, 'create_conversation');
}

export async function GET(request: NextRequest) {
  return withLogging(request, async () => {
    const allConversations = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt));

    const conversationsWithMessages = await Promise.all(
      allConversations.map(async (conv) => {
        const convMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(messages.createdAt);

        return {
          ...conv,
          messages: convMessages,
        };
      })
    );

    return NextResponse.json(conversationsWithMessages);
  }, 'list_conversations');
}

export async function DELETE(request: NextRequest) {
  return withLogging(request, async () => {
    await db.delete(conversations);
    return NextResponse.json({ message: 'All conversations cleared' });
  }, 'clear_all_conversations');
}
