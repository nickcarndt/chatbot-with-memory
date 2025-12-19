import OpenAI from 'openai';
import { getEnv } from './env';

const MODEL = 'gpt-3.5-turbo';

const env = getEnv();
const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  conversationId?: string
): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.8,
      max_tokens: 1000,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`OpenAI API error: ${errorMessage}`);
  }
}

export { MODEL };
