import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required').startsWith('sk-', 'OPENAI_API_KEY must start with sk-'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missing}`);
    }
    throw error;
  }
}

// Validate on import in server-side code (skip during build)
// Next.js builds don't have env vars, validation happens at runtime
if (typeof window === 'undefined' && !process.env.NEXT_PHASE) {
  try {
    getEnv();
  } catch (error) {
    // Only throw in non-test environments at runtime
    if (process.env.NODE_ENV !== 'test') {
      // Don't exit during build - env vars are set at runtime on Vercel
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        // In production, log but don't exit (env vars set at runtime)
        console.warn('Environment validation failed (will retry at runtime):', error instanceof Error ? error.message : String(error));
      } else {
        console.error('Environment validation failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  }
}
