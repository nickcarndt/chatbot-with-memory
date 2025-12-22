#!/usr/bin/env tsx
/**
 * Commerce health verification script
 * Calls GET /api/commerce/health to verify MCP connectivity
 */

async function main() {
  const url = 'http://localhost:3000/api/commerce/health';
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.ok && data.mcp) {
      console.log('\n✅ Commerce MCP is healthy');
      process.exit(0);
    } else if (data.disabled) {
      console.log('\n⚠️  Commerce is disabled (COMMERCE_ENABLED !== true)');
      process.exit(0);
    } else {
      console.log('\n❌ Commerce MCP connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error calling health endpoint:', error instanceof Error ? error.message : String(error));
    console.error('   Make sure dev server is running: npm run dev');
    process.exit(1);
  }
}

main();

