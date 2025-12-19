import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { getEnv } from '../env';

// Lazy initialization - only call getEnv() when db is actually used (at runtime, not during build)
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const env = getEnv();
    const sql = neon(env.DATABASE_URL);
    _db = drizzle(sql as any, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  },
});

export type Database = typeof db;
