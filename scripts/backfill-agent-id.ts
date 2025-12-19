#!/usr/bin/env tsx
/**
 * Backfill script: Set agent_id='general' for existing conversations
 * Run this once after adding the agent_id column to the schema
 */

import { neon } from '@neondatabase/serverless';
import { getEnv } from '../lib/env';

async function backfill() {
  const env = getEnv();
  const sql = neon(env.DATABASE_URL);

  try {
    // Update any conversations without agent_id (shouldn't happen with default, but safe)
    await sql`
      UPDATE conversations 
      SET agent_id = 'general' 
      WHERE agent_id IS NULL OR agent_id = ''
    `;
    
    console.log('✅ Backfill complete');
    console.log('   Existing conversations set to agent_id="general"');
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
}

backfill();
