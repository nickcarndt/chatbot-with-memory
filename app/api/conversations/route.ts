import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withLogging, getRequestId } from '@/lib/api-helpers';
import { messages } from '@/lib/db/schema';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withLogging(request, async () => {
    const body = await request.json();
    const title = body.title || 'New Conversation';

    const [newConversation] = await db
      .insert(conversations)
      .values({ title })
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

    // Fetch messages for each conversation
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
