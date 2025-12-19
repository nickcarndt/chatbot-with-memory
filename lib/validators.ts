/**
 * Zod schemas for input validation
 */

import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const createConversationSchema = z.object({
  title: z.string().max(200, 'Title too long').optional(),
}).strict();

export const sendMessageSchema = z.object({
  role: z.enum(['user', 'assistant'], {
    errorMap: () => ({ message: 'role must be "user" or "assistant"' }),
  }),
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(10000, 'Content too long (max 10000 characters)'),
}).strict();

/**
 * Validate UUID from route params
 */
export function validateUuid(id: string): { valid: true } | { valid: false; error: string } {
  try {
    uuidSchema.parse(id);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid UUID' };
    }
    return { valid: false, error: 'Invalid UUID format' };
  }
}

/**
 * Maximum request body size (10KB)
 */
export const MAX_BODY_SIZE = 10 * 1024;
