#!/usr/bin/env node

/**
 * Wait for the Next.js dev server to be ready
 */

const http = require('http');

const MAX_ATTEMPTS = 60;
const DELAY = 1000;
const HEALTH_URL = 'http://localhost:3000/api/health';

function checkHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(HEALTH_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.ok && json.db) {
            resolve(true);
          } else {
            reject(new Error('Health check returned unhealthy status'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function waitForServer() {
  console.log('Waiting for server to be ready...');
  
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      await checkHealth();
      console.log('Server is ready!');
      return;
    } catch (error) {
      if (i < MAX_ATTEMPTS - 1) {
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, DELAY));
      } else {
        console.error('\nServer failed to start after maximum attempts');
        process.exit(1);
      }
    }
  }
}

waitForServer();
