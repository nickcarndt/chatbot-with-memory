#!/usr/bin/env node

/**
 * Smoke test script for end-to-end validation
 * Tests: health check, conversation creation, message memory, cleanup
 */

const API_BASE = 'http://localhost:3000/api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  requestId?: string;
}

const results: TestResult[] = [];

async function fetchWithRequestId(url: string, options?: RequestInit): Promise<{ response: Response; requestId: string }> {
  const response = await fetch(url, options);
  const requestId = response.headers.get('X-Request-ID') || 'unknown';
  return { response, requestId };
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage });
    console.error(`✗ ${name}: ${errorMessage}`);
    throw error;
  }
}

async function waitForHealth(maxAttempts = 30, delay = 1000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { response } = await fetchWithRequestId(`${API_BASE}/health`);
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.db) {
          return;
        }
      }
    } catch (error) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Health check failed after maximum attempts');
}

async function runSmokeTest(): Promise<void> {
  console.log('Starting smoke test...\n');

  let conversationId: string | null = null;
  let lastRequestId: string | null = null;

  // Test 1: Health check
  await test('Health check', async () => {
    const { response, requestId } = await fetchWithRequestId(`${API_BASE}/health`);
    lastRequestId = requestId;
    
    if (!response.ok) {
      throw new Error(`Health check returned ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.ok || !data.db) {
      throw new Error(`Health check failed: ${JSON.stringify(data)}`);
    }
    
    console.log(`  Request ID: ${requestId}`);
  });

  // Test 2: Create conversation
  await test('Create conversation', async () => {
    const { response, requestId } = await fetchWithRequestId(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    lastRequestId = requestId;
    
    if (!response.ok) {
      throw new Error(`Create conversation returned ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.id) {
      throw new Error('Conversation ID not returned');
    }
    
    conversationId = data.id;
    console.log(`  Conversation ID: ${conversationId}`);
    console.log(`  Request ID: ${requestId}`);
  });

  if (!conversationId) {
    throw new Error('Failed to create conversation');
  }

  // Test 3: Send first message (memory)
  await test('Send message: Remember favorite color', async () => {
    const { response, requestId } = await fetchWithRequestId(
      `${API_BASE}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: 'Remember my favorite color is blue.',
        }),
      }
    );
    lastRequestId = requestId;
    
    if (!response.ok) {
      throw new Error(`Send message returned ${response.status}`);
    }
    
    const data = await response.json();
    if (data.role !== 'assistant') {
      throw new Error('Expected assistant response');
    }
    
    console.log(`  Request ID: ${requestId}`);
  });

  // Test 4: Test memory (ask about favorite color)
  await test('Test memory: Ask about favorite color', async () => {
    const { response, requestId } = await fetchWithRequestId(
      `${API_BASE}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: 'What is my favorite color?',
        }),
      }
    );
    lastRequestId = requestId;
    
    if (!response.ok) {
      throw new Error(`Send message returned ${response.status}`);
    }
    
    const data = await response.json();
    if (data.role !== 'assistant') {
      throw new Error('Expected assistant response');
    }
    
    const content = data.content.toLowerCase();
    if (!content.includes('blue')) {
      throw new Error(`Response does not contain "blue". Response: ${data.content.substring(0, 100)}...`);
    }
    
    console.log(`  Assistant response contains "blue": ✓`);
    console.log(`  Response preview: ${data.content.substring(0, 80)}...`);
    console.log(`  Request ID: ${requestId}`);
  });

  // Test 5: Cleanup
  await test('Delete conversation', async () => {
    const { response, requestId } = await fetchWithRequestId(
      `${API_BASE}/conversations/${conversationId}`,
      {
        method: 'DELETE',
      }
    );
    lastRequestId = requestId;
    
    if (!response.ok) {
      throw new Error(`Delete conversation returned ${response.status}`);
    }
    
    console.log(`  Request ID: ${requestId}`);
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('Smoke Test Summary');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✓' : '✗';
    console.log(`${icon} ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  if (lastRequestId) {
    console.log(`Last Request ID: ${lastRequestId}`);
  }
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    // Wait for server to be ready
    console.log('Waiting for server to be ready...');
    await waitForHealth();
    console.log('Server is ready!\n');
    
    // Run smoke tests
    await runSmokeTest();
    
    console.log('\n✓ All smoke tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Smoke test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
