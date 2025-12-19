#!/usr/bin/env tsx
/**
 * Backfill script: Set agent_id='general' for existing conversations
 * Run this once after adding the agent_id column to the schema
 */

import { neon } from '@neondatabase/serverless';

async function backfill() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

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
