/**
 * LLM wrapper with timeouts, error handling, and SMOKE_TEST mode
 * Never logs prompts or responses
 */

import OpenAI from 'openai';
import { getEnv } from './env';

export const MODEL = 'gpt-3.5-turbo' as const;
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const SMOKE_TEST_MAX_TOKENS = 120;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Lazy initialization - only call getEnv() when client is actually used (at runtime, not during build)
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const env = getEnv();
    _client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      timeout: DEFAULT_TIMEOUT_MS,
    });
  }
  return _client;
}

const isSmokeTest = process.env.SMOKE_TEST === 'true';

export async function getChatCompletion(
  messages: ChatMessage[],
  conversationId?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ChatCompletionResult> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
      const response = await getClient().chat.completions.create(
      {
        model: MODEL,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: isSmokeTest ? 0 : 0.8,
        max_tokens: isSmokeTest ? SMOKE_TEST_MAX_TOKENS : 1000,
        presence_penalty: isSmokeTest ? 0 : 0.6,
        frequency_penalty: isSmokeTest ? 0 : 0.3,
      },
      {
        signal: abortController.signal,
      }
    );

    clearTimeout(timeoutId);

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('Empty response from OpenAI');
    }

    return {
      content: choice.message.content,
      model: response.model,
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error('OpenAI API timeout');
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw new Error('Unknown OpenAI API error');
  }
}
