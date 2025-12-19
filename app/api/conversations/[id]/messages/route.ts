import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withLogging, getRequestId } from '@/lib/api-helpers';
import { getChatCompletion } from '@/lib/llm';
import { logInfo, logError } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withLogging(request, async () => {
    const requestId = getRequestId(request);
    const body = await request.json();
    const { role, content } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: 'role and content are required' },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, params.id))
      .limit(1);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Save user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        conversationId: params.id,
        role,
        content,
      })
      .returning();

    // Update conversation title if it's the first user message
    if (conversation.title === 'New Conversation' && role === 'user') {
      const title = content.length > 40 ? content.substring(0, 37) + '...' : content;
      await db
        .update(conversations)
        .set({ title })
        .where(eq(conversations.id, params.id));
    }

    // Get conversation history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.id))
      .orderBy(messages.createdAt);

    // Generate assistant response with memory
    const startTime = Date.now();
    let assistantContent: string;
    let errorType: string | undefined;

    try {
      assistantContent = await getChatCompletion(
        history.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        params.id
      );

      const durationMs = Date.now() - startTime;
      logInfo('openai_request_success', {
        request_id: requestId,
        conversation_id: params.id,
        model: 'gpt-3.5-turbo',
        duration_ms: durationMs,
        message_count: history.length,
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
      assistantContent = "I apologize, but I'm having trouble connecting to my AI service right now. Please try again later.";

      logError('openai_request_failed', {
        request_id: requestId,
        conversation_id: params.id,
        model: 'gpt-3.5-turbo',
        duration_ms: durationMs,
        error_type: errorType,
        message_count: history.length,
      });
    }

    // Save assistant message
    const [assistantMessage] = await db
      .insert(messages)
      .values({
        conversationId: params.id,
        role: 'assistant',
        content: assistantContent,
      })
      .returning();

    return NextResponse.json(assistantMessage, { status: 201 });
  }, 'create_message');
}
