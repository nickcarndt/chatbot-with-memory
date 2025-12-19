import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { getEnv } from '../env';

const env = getEnv();
const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql as any, { schema });
export type Database = typeof db;
