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

// Skip validation on import - only validate when getEnv() is called at runtime
// During Next.js build, env vars aren't available, so we defer validation to runtime
