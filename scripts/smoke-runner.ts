#!/usr/bin/env node

/**
 * Smoke test runner that:
 * 1. Starts dev server
 * 2. Waits for health endpoint
 * 3. Runs smoke tests
 * 4. Shuts down dev server
 */

import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

let devServer: ChildProcess | null = null;

async function startDevServer(): Promise<void> {
  console.log('Starting Next.js dev server...');
  
  devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PORT: '3000' },
  });

  // Pipe output but don't wait for it
  devServer.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ready') || output.includes('Local:')) {
      // Server is starting
    }
  });

  devServer.stderr?.on('data', (data) => {
    // Ignore stderr for now
  });

  // Wait a bit for server to start
  await sleep(3000);
}

async function waitForHealth(maxAttempts = 60, delay = 1000): Promise<void> {
  console.log('Waiting for server to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.db) {
          console.log('Server is ready!');
          return;
        }
      }
    } catch (error) {
      // Continue waiting
    }
    
    if (i < maxAttempts - 1) {
      process.stdout.write('.');
      await sleep(delay);
    }
  }
  
  throw new Error('Server failed to start after maximum attempts');
}

async function runSmokeTest(): Promise<void> {
  return new Promise((resolve, reject) => {
    const smokeTest = spawn('tsx', ['scripts/smoke.ts'], {
      stdio: 'inherit',
      shell: true,
    });

    smokeTest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Smoke test failed with code ${code}`));
      }
    });

    smokeTest.on('error', (error) => {
      reject(error);
    });
  });
}

function stopDevServer(): void {
  if (devServer) {
    console.log('\nStopping dev server...');
    devServer.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (devServer && !devServer.killed) {
        devServer.kill('SIGKILL');
      }
    }, 5000);
  }
}

// Cleanup on exit
process.on('SIGINT', () => {
  stopDevServer();
  process.exit(1);
});

process.on('SIGTERM', () => {
  stopDevServer();
  process.exit(1);
});

async function main() {
  try {
    // Start dev server
    await startDevServer();
    
    // Wait for health check
    await waitForHealth();
    console.log('');
    
    // Run smoke tests
    await runSmokeTest();
    
    // Stop dev server
    stopDevServer();
    
    console.log('\n✓ Smoke test completed successfully!');
    process.exit(0);
  } catch (error) {
    stopDevServer();
    console.error('\n✗ Smoke test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
