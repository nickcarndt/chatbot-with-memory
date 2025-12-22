import { NextRequest, NextResponse } from 'next/server';
import { withLogging, parseBody } from '@/lib/api-helpers';
import { validateUuid, sendMessageSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getChatCompletion, MODEL } from '@/lib/llm';
import { logInfo, logError } from '@/lib/logger';
import { getAgentSystemPrompt, type AgentId } from '@/lib/agents';
import { randomUUID, createHash } from 'crypto';
import { mcpCallTool } from '@/lib/mcp';

export const runtime = 'nodejs';

const RATE_LIMITS = {
  perMinute: 5,
  perDay: 20,
  perConversationDay: 10,
};

type ToolTraceEntry = {
  tool: string;
  ok: boolean;
  durationMs: number;
  inputPreview: string;
  outputPreview: string;
  at: string;
};

type NormalizedSearchItem = {
  title: string;
  price: string;
  variantId: string;
  available?: boolean;
};

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp;
  return 'unknown';
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

function buildPreview(value: unknown): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (!str) return '';
  return str.length > 180 ? `${str.slice(0, 177)}...` : str;
}

function normalizeSearchResults(raw: any): NormalizedSearchItem[] {
  const list = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
  return list.slice(0, 5).map((item: any, idx: number) => {
    const title = typeof item?.title === 'string' && item.title.trim() ? item.title : `Item ${idx + 1}`;
    const price =
      typeof item?.price === 'string'
        ? item.price
        : typeof item?.price === 'number'
        ? item.price.toString()
        : item?.price?.amount
        ? String(item.price.amount)
        : '—';
    const variantId =
      typeof item?.variantId === 'string'
        ? item.variantId
        : typeof item?.id === 'string'
        ? item.id
        : `variant-${idx + 1}`;
    const available = typeof item?.available === 'boolean' ? item.available : undefined;
    return { title, price, variantId, available };
  });
}

async function checkRateLimits({
  ipHash,
  conversationId,
}: {
  ipHash: string;
  conversationId: string;
}) {
  const now = new Date();
  const minuteAgo = new Date(now.getTime() - 60_000);
  const dayAgo = new Date(now.getTime() - 86_400_000);

  const minute = await db.execute(
    sql`select count(*)::int as count from ${messages} where role = 'assistant' and ${messages.createdAt} > ${minuteAgo} and (${messages.meta} ->> 'ipHash') = ${ipHash}`
  );
  const day = await db.execute(
    sql`select count(*)::int as count from ${messages} where role = 'assistant' and ${messages.createdAt} > ${dayAgo} and (${messages.meta} ->> 'ipHash') = ${ipHash}`
  );
  const convDay = await db.execute(
    sql`select count(*)::int as count from ${messages} where role = 'assistant' and ${messages.createdAt} > ${dayAgo} and ${messages.conversationId} = ${conversationId} and ((${messages.meta} ->> 'ipHash') = ${ipHash} or ${messages.meta} ? 'toolTrace')`
  );

  const minuteCount = Number(minute.rows[0]?.count ?? 0);
  const dayCount = Number(day.rows[0]?.count ?? 0);
  const convDayCount = Number(convDay.rows[0]?.count ?? 0);

  if (minuteCount >= RATE_LIMITS.perMinute || dayCount >= RATE_LIMITS.perDay || convDayCount >= RATE_LIMITS.perConversationDay) {
    return false;
  }
  return true;
}

function parseCommerceCommand(content: string): { type: 'search'; query: string } | { type: 'checkout'; itemNumber: number; qty: number } | null {
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();

  const searchMatch =
    lower.startsWith('search ') ||
    lower.startsWith('find ') ||
    lower.startsWith('show ');
  if (searchMatch) {
    const query = trimmed.replace(/^(search|find|show)\s+/i, '').trim();
    if (query) {
      return { type: 'search', query };
    }
  }

  const checkoutMatch = trimmed.match(/checkout\s+(\d+)(?:\s+qty\s+(\d+))?/i);
  if (checkoutMatch) {
    const itemNumber = parseInt(checkoutMatch[1] || '0', 10);
    const qtyRaw = checkoutMatch[2] ? parseInt(checkoutMatch[2], 10) : 1;
    const qty = Math.max(1, Math.min(3, isNaN(qtyRaw) ? 1 : qtyRaw));
    if (itemNumber > 0) {
      return { type: 'checkout', itemNumber, qty };
    }
  }

  return null;
}

function extractCheckoutUrl(result: any): string | null {
  if (!result || typeof result !== 'object') return null;
  const candidates = ['url', 'checkoutUrl', 'checkout_url'];
  for (const key of candidates) {
    const val = (result as any)[key];
    if (typeof val === 'string' && val.startsWith('http')) {
      return val;
    }
  }
  return null;
}

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
    const agentId = (conversation.agentId as AgentId) || 'general';

    if (agentId === 'commerce') {
      const commerceResponse = (payload: any, status = 201) => {
        const res = NextResponse.json(payload, { status });
        res.headers.set('X-Request-ID', requestId);
        return res;
      };
      const featureEnabled = process.env.COMMERCE_ENABLED === 'true';
      const baseMeta = {
        requestId,
        agentId: conversation.agentId,
      };

      try {
      if (!featureEnabled) {
        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId: params.id,
            role: 'assistant',
            content: 'Commerce tools are disabled. Set COMMERCE_ENABLED=true and MCP_SERVER_URL to enable.',
            meta: baseMeta,
          })
          .returning();

        return commerceResponse({
          ...assistantMessage,
          meta: assistantMessage.meta || {},
        });
      }

      const command = parseCommerceCommand(content);

      if (!command) {
        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId: params.id,
            role: 'assistant',
            content:
              'Supported commands:\n- search <query>\n- checkout <itemNumber> qty <n>\nExample: search hoodies under $80',
            meta: baseMeta,
          })
          .returning();

        return commerceResponse({
          ...assistantMessage,
          meta: assistantMessage.meta || {},
        });
      }

      const clientIp = getClientIp(request);
      const ipHash = hashIp(clientIp);

      const enforceLimits = await checkRateLimits({
        ipHash,
        conversationId: params.id,
      });

      if (!enforceLimits) {
        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId: params.id,
            role: 'assistant',
            content: 'Rate limit reached — try again shortly.',
            meta: {
              ...baseMeta,
              ipHash,
            },
          })
          .returning();

        return commerceResponse({
          ...assistantMessage,
          meta: assistantMessage.meta || {},
        });
      }

      if (command.type === 'search') {
        const mcpStart = Date.now();
        let toolTrace: ToolTraceEntry[] = [];
        let normalized: NormalizedSearchItem[] = [];

        try {
          const mcpResult = await mcpCallTool('shopify_search_products', { q: command.query });
          normalized = normalizeSearchResults(mcpResult);

          const durationMs = Date.now() - mcpStart;
          toolTrace.push({
            tool: 'shopify_search_products',
            ok: true,
            durationMs,
            inputPreview: buildPreview({ q: command.query }),
            outputPreview: buildPreview(normalized),
            at: new Date().toISOString(),
          });
        } catch (error: any) {
          const durationMs = Date.now() - mcpStart;
          toolTrace.push({
            tool: 'shopify_search_products',
            ok: false,
            durationMs,
            inputPreview: buildPreview({ q: command.query }),
            outputPreview: buildPreview(error?.message || 'error'),
            at: new Date().toISOString(),
          });

          const [assistantMessage] = await db
            .insert(messages)
            .values({
              conversationId: params.id,
              role: 'assistant',
              content: 'MCP tools unavailable right now. Check COMMERCE_ENABLED + MCP_SERVER_URL.',
              meta: {
                ...baseMeta,
                toolTrace,
                ipHash,
              },
            })
            .returning();

          return commerceResponse({
            ...assistantMessage,
            meta: assistantMessage.meta || {},
          });
        }

        const listText = normalized
          .map((item, idx) => `${idx + 1}. ${item.title} — ${item.price}${item.available === false ? ' (unavailable)' : ''}`)
          .join('\n');

        const llmMessages = [
          {
            role: 'system' as const,
            content:
              'You are a commerce assistant. Start with "✅ Shopify search complete" then use the provided search results to reply with a numbered list 1..N exactly as provided. Do not invent items. End with the line: Reply "checkout <n> qty <q>" (test mode).',
          },
          {
            role: 'user' as const,
            content: `Search results:\n${listText}`,
          },
        ];

        let assistantContent = '';
        let model: string = MODEL;
        let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
        const t0 = Date.now();

        try {
          const result = await getChatCompletion(llmMessages, params.id);
          assistantContent = result.content;
          model = result.model;
          usage = result.usage;

          const durationMs = Date.now() - t0;
          logInfo('openai_request_success', {
            request_id: requestId,
            conversation_id: params.id,
            model,
            duration_ms: durationMs,
            message_count: history.length,
          });
        } catch (error) {
          const durationMs = Date.now() - t0;
          assistantContent = 'Unable to format results right now. Please try again.';

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

        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId: params.id,
            role: 'assistant',
            content: assistantContent,
            meta: {
              ...baseMeta,
              durationMs,
              model,
              usage,
              lastSearchResults: normalized,
              toolTrace,
              ipHash,
            },
          })
          .returning();

        return commerceResponse({
          ...assistantMessage,
          meta: assistantMessage.meta || {},
        });
      }

      // checkout flow
      const lastSearch = await db
        .select()
        .from(messages)
        .where(
          sql`${messages.conversationId} = ${params.id} and ${messages.role} = 'assistant' and ${messages.meta} ? 'lastSearchResults'`
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const lastSearchResults = (lastSearch[0]?.meta as any)?.lastSearchResults as NormalizedSearchItem[] | undefined;

      if (!lastSearchResults || lastSearchResults.length === 0) {
        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId: params.id,
            role: 'assistant',
            content: 'No recent search results found. Run a search first.',
            meta: baseMeta,
          })
          .returning();

        return commerceResponse({
          ...assistantMessage,
          meta: assistantMessage.meta || {},
        });
      }

      const item = lastSearchResults[command.itemNumber - 1];
      if (!item) {
        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId: params.id,
            role: 'assistant',
            content: 'Invalid item number. Please use a number from the latest search results.',
            meta: baseMeta,
          })
          .returning();

        return commerceResponse({
          ...assistantMessage,
          meta: assistantMessage.meta || {},
        });
      }

      const qty = Math.max(1, Math.min(3, command.qty));

      const mcpStart = Date.now();
      let toolTrace: ToolTraceEntry[] = [];
      let checkoutUrl: string | null = null;

      try {
        const mcpResult = await mcpCallTool('stripe_create_checkout_session', {
          items: [
            {
              title: item.title,
              price: item.price,
              variantId: item.variantId,
              qty,
            },
          ],
        });

        checkoutUrl = extractCheckoutUrl(mcpResult);

        const durationMs = Date.now() - mcpStart;
        toolTrace.push({
          tool: 'stripe_create_checkout_session',
          ok: true,
          durationMs,
          inputPreview: buildPreview({ item: command.itemNumber, qty }),
          outputPreview: buildPreview(checkoutUrl || mcpResult),
          at: new Date().toISOString(),
        });
      } catch (error: any) {
        const durationMs = Date.now() - mcpStart;
        toolTrace.push({
          tool: 'stripe_create_checkout_session',
          ok: false,
          durationMs,
          inputPreview: buildPreview({ item: command.itemNumber, qty }),
          outputPreview: buildPreview(error?.message || 'error'),
          at: new Date().toISOString(),
        });

        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId: params.id,
            role: 'assistant',
            content: 'MCP tools unavailable right now. Check COMMERCE_ENABLED + MCP_SERVER_URL.',
            meta: {
              ...baseMeta,
              toolTrace,
              ipHash,
            },
          })
          .returning();

        return commerceResponse({
          ...assistantMessage,
          meta: assistantMessage.meta || {},
        });
      }

      if (!checkoutUrl) {
        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId: params.id,
            role: 'assistant',
            content: 'Checkout URL missing. Please try again.',
            meta: {
              ...baseMeta,
              toolTrace,
              ipHash,
            },
          })
          .returning();

        return commerceResponse({
          ...assistantMessage,
          meta: assistantMessage.meta || {},
        });
      }

      const llmMessages = [
        {
          role: 'system' as const,
          content:
            'You are a commerce assistant. Start with "✅ Stripe checkout created (test mode)" then include exactly one markdown link: [Open Stripe Checkout](<url>). Do not add extra links or text after the link.',
        },
        {
          role: 'user' as const,
          content: `Checkout URL: ${checkoutUrl}`,
        },
      ];

      let assistantContent = '';
      let model: string = MODEL;
      let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
      const t0 = Date.now();

      try {
        const result = await getChatCompletion(llmMessages, params.id);
        assistantContent = result.content;
        model = result.model;
        usage = result.usage;

        const durationMs = Date.now() - t0;
        logInfo('openai_request_success', {
          request_id: requestId,
          conversation_id: params.id,
            model,
          duration_ms: durationMs,
          message_count: history.length,
        });
      } catch (error) {
        const durationMs = Date.now() - t0;
        assistantContent = `✅ Stripe checkout created (test mode)\n\n[Open Stripe Checkout](${checkoutUrl})`;

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

      if (!assistantContent.includes('[Open Stripe Checkout]')) {
        assistantContent = `✅ Stripe checkout created (test mode)\n\n[Open Stripe Checkout](${checkoutUrl})`;
      } else if (!assistantContent.includes('✅')) {
        assistantContent = `✅ Stripe checkout created (test mode)\n\n${assistantContent}`;
      }

      const [assistantMessage] = await db
        .insert(messages)
        .values({
          conversationId: params.id,
          role: 'assistant',
          content: assistantContent,
          meta: {
            ...baseMeta,
            durationMs,
            model,
            usage,
            toolTrace,
            ipHash,
          },
        })
        .returning();

      return commerceResponse({
        ...assistantMessage,
        meta: assistantMessage.meta || {},
      });
      } catch (error: any) {
        const clientIp = getClientIp(request);
        const ipHash = hashIp(clientIp);
        const fallbackStart = Date.now();
        const errorMsg = error?.message || String(error) || 'Unknown error';
        const durationMs = Date.now() - fallbackStart;

        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId: params.id,
            role: 'assistant',
            content: 'Commerce tools unavailable right now. Check COMMERCE_ENABLED + MCP_SERVER_URL.',
            meta: {
              ...baseMeta,
              ipHash,
              toolTrace: [
                {
                  tool: 'commerce_fallback',
                  ok: false,
                  durationMs,
                  inputPreview: '',
                  outputPreview: buildPreview(errorMsg),
                  at: new Date().toISOString(),
                },
              ],
            },
          })
          .returning();

        return commerceResponse({
          ...assistantMessage,
          meta: assistantMessage.meta || {},
        });
      }
    }
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
