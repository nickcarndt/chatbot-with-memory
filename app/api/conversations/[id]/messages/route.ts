import { NextRequest, NextResponse } from 'next/server';
import { withLogging, parseBody, getRequestId } from '@/lib/api-helpers';
import { validateUuid, sendMessageSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getChatCompletion, MODEL } from '@/lib/llm';
import { logInfo, logError } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(
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
    const validation = sendMessageSchema.safeParse(body);
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

    const { role, content } = validation.data;

    // Verify conversation exists
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

    // Save user message
    await db.insert(messages).values({
      conversationId: params.id,
      role,
      content,
    });

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

    try {
      const result = await getChatCompletion(
        history.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        params.id
      );

      assistantContent = result.content;

      const durationMs = Date.now() - startTime;
      logInfo('openai_request_success', {
        request_id: requestId,
        conversation_id: params.id,
        model: MODEL,
        duration_ms: durationMs,
        message_count: history.length,
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      assistantContent = "I apologize, but I'm having trouble connecting to my AI service right now. Please try again later.";

      logError('openai_request_failed', {
        request_id: requestId,
        conversation_id: params.id,
        model: MODEL,
        duration_ms: durationMs,
        error: error instanceof Error ? error : new Error(String(error)),
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
