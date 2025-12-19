import { NextRequest, NextResponse } from 'next/server';
import { withLogging, parseBody, getRequestId } from '@/lib/api-helpers';
import { validateUuid, sendMessageSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getChatCompletion, MODEL } from '@/lib/llm';
import { logInfo, logError } from '@/lib/logger';
import { getAgentSystemPrompt } from '@/lib/agents';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withLogging(request, async () => {
    const requestId = request.headers.get('x-request-id') ?? randomUUID();

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
    const [userMessage] = await db.insert(messages).values({
      conversationId: params.id,
      role,
      content,
      meta: {},
    }).returning();

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

    // Build messages array with system prompt for agent
    const agentId = (conversation.agentId as 'general' | 'sales' | 'support' | 'engineering' | 'exec') || 'general';
    const systemPrompt = getAgentSystemPrompt(agentId);
    
    const messagesForLLM = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
    ];

    // Generate assistant response with memory
    const t0 = Date.now();
    let assistantContent: string;
    let model: string = MODEL;
    let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;

    try {
      const result = await getChatCompletion(
        messagesForLLM,
        params.id
      );

      assistantContent = result.content;
      model = result.model;
      usage = result.usage;

      const durationMs = Date.now() - t0;
      logInfo('openai_request_success', {
        request_id: requestId,
        conversation_id: params.id,
        model: MODEL,
        duration_ms: durationMs,
        message_count: history.length,
      });
    } catch (error) {
      const durationMs = Date.now() - t0;
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

    const durationMs = Date.now() - t0;

    // Save assistant message with metadata
    const [assistantMessage] = await db
      .insert(messages)
      .values({
        conversationId: params.id,
        role: 'assistant',
        content: assistantContent,
        meta: {
          requestId,
          durationMs,
          agentId: conversation.agentId,
          model,
          usage,
        },
      })
      .returning();

    // Return assistant message with metadata
    const response = NextResponse.json(
      {
        ...assistantMessage,
        meta: assistantMessage.meta || {},
      },
      { status: 201 }
    );
    response.headers.set('X-Request-ID', requestId);
    return response;
  }, 'create_message');
}
