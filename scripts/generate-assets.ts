#!/usr/bin/env tsx

/**
 * Generate demo assets: public/demo.png and public/og.png
 * 
 * This script:
 * 1. Starts Next.js dev server
 * 2. Uses Playwright to capture a screenshot for demo.png
 * 3. Uses Satori to generate og.png
 */

import { chromium } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const DEMO_PATH = join(process.cwd(), 'public', 'demo.png');
const OG_PATH = join(process.cwd(), 'public', 'og.png');

let devServer: ChildProcess | null = null;

async function startDevServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting Next.js dev server...');
    devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true,
    });

    let output = '';
    devServer.stdout?.on('data', (data) => {
      output += data.toString();
      if (output.includes('Ready') || output.includes('Local:')) {
        console.log('Dev server ready');
        setTimeout(resolve, 2000); // Give it a moment to fully start
      }
    });

    devServer.stderr?.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Error') && !text.includes('EADDRINUSE')) {
        console.error('Dev server error:', text);
      }
    });

    devServer.on('error', reject);

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!output.includes('Ready') && !output.includes('Local:')) {
        reject(new Error('Dev server timeout'));
      }
    }, 30000);
  });
}

async function stopDevServer(): Promise<void> {
  if (devServer) {
    console.log('Stopping dev server...');
    devServer.kill();
    devServer = null;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function generateDemoPNG(): Promise<void> {
  console.log('Generating demo.png...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    // Navigate to app
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Create conversation via API
    const convResponse = await page.evaluate(async () => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: 'engineering' }),
      });
      return res.json();
    });
    const conversationId = convResponse.id;
    console.log('Created conversation:', conversationId);

    // Send a message that will produce markdown
    const messageContent = `Explain the tradeoffs between Server-Sent Events (SSE) and WebSockets. Include:
- **Performance** considerations
- Use cases for each
- Code example for SSE

Format your response with proper markdown.`;

    await page.evaluate(async (data) => {
      await fetch(`/api/conversations/${data.conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: data.content,
        }),
      });
    }, { conversationId, content: messageContent });

    // Wait for assistant response
    await page.waitForTimeout(5000);

    // Reload to see the conversation
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Reload page to see the conversation in sidebar
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click on the conversation in sidebar (try multiple selectors)
    const conversationSelectors = [
      'text=/Explain the tradeoffs/i',
      'text=/SSE/i',
      '[class*="conversation"]',
      'div[class*="rounded-md"]',
    ];
    
    let clicked = false;
    for (const selector of conversationSelectors) {
      try {
        await page.click(selector, { timeout: 2000 });
        clicked = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      console.log('Could not click conversation, trying to navigate directly...');
      await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
    }
    
    await page.waitForTimeout(3000);

    // Wait for messages to load
    await page.waitForSelector('[class*="MessageBubble"], [class*="message"]', { timeout: 10000 }).catch(() => {
      console.log('Messages may not be visible, continuing...');
    });

    // Click the info icon on assistant message to open Inspector
    const infoIcon = page.locator('svg[viewBox="0 0 24 24"]').first();
    if (await infoIcon.count() > 0) {
      await infoIcon.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
    }

    // Take screenshot
    await page.screenshot({
      path: DEMO_PATH,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });

    console.log('✓ demo.png generated');
  } catch (error) {
    console.error('Error generating demo.png:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function generateOGPNG(): Promise<void> {
  console.log('Generating og.png...');

  // Use system font - Satori will fallback gracefully
  const font = {
    name: 'system-ui',
    data: Buffer.from(''),
    weight: 400 as const,
    style: 'normal' as const,
  };

  const element = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '80px',
              flex: 1,
            },
            children: [
              {
                type: 'h1',
                props: {
                  style: {
                    fontSize: '56px',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '40px',
                    lineHeight: 1.1,
                  },
                  children: 'Chatbot with Memory',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '20px',
                    color: '#64748b',
                    marginBottom: '32px',
                  },
                  children: 'Department agents • Inspector • Request tracing',
                },
              },
              {
                type: 'ul',
                props: {
                  style: {
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    fontSize: '24px',
                    color: '#475569',
                    lineHeight: 1.8,
                  },
                  children: [
                    {
                      type: 'li',
                      props: {
                        style: { marginBottom: '16px', display: 'flex', alignItems: 'center' },
                        children: [
                          { type: 'span', props: { style: { color: '#3b82f6', marginRight: '12px' }, children: '→' } },
                          { type: 'span', props: { children: 'Prompt routing by department' } },
                        ],
                      },
                    },
                    {
                      type: 'li',
                      props: {
                        style: { marginBottom: '16px', display: 'flex', alignItems: 'center' },
                        children: [
                          { type: 'span', props: { style: { color: '#3b82f6', marginRight: '12px' }, children: '→' } },
                          { type: 'span', props: { children: 'Inspector: system prompt + metadata' } },
                        ],
                      },
                    },
                    {
                      type: 'li',
                      props: {
                        style: { marginBottom: '16px', display: 'flex', alignItems: 'center' },
                        children: [
                          { type: 'span', props: { style: { color: '#3b82f6', marginRight: '12px' }, children: '→' } },
                          { type: 'span', props: { children: 'Request ID correlation with Vercel logs' } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '60px',
              width: '400px',
              backgroundColor: '#f8fafc',
              borderLeft: '1px solid #e2e8f0',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '14px',
                          color: '#0f172a',
                          marginBottom: '8px',
                        },
                        children: 'Explain tradeoffs of SSE vs WS',
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          display: 'inline-block',
                          backgroundColor: '#1e293b',
                          color: '#cbd5e1',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                        },
                        children: 'Engineering',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    width: '100%',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '14px',
                    marginLeft: '80px',
                  },
                  children: 'Here\'s a comparison...',
                },
              },
            ],
          },
        },
      ],
    },
  } as any;

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [font],
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngData = resvg.render();
  await writeFile(OG_PATH, pngData.asPng());

  console.log('✓ og.png generated');
}

async function main() {
  try {
    // Generate OG image first (doesn't need server)
    await generateOGPNG();

    // Start server and generate demo screenshot
    await startDevServer();
    await generateDemoPNG();
  } catch (error) {
    console.error('Error generating assets:', error);
    process.exit(1);
  } finally {
    await stopDevServer();
  }

  console.log('\n✓ All assets generated successfully!');
}

main();
