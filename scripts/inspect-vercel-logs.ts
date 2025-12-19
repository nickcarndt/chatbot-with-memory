#!/usr/bin/env node

/**
 * Script to inspect Vercel deployment logs and observability
 * Requires: vercel CLI to be installed and authenticated
 */

import { execSync } from 'child_process';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  request_id?: string;
  [key: string]: unknown;
}

function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}`);
  }
}

function getDeployments() {
  console.log('Fetching recent deployments...\n');
  const output = runCommand('vercel ls --json');
  return JSON.parse(output);
}

function getLogs(deploymentId?: string) {
  const cmd = deploymentId 
    ? `vercel logs ${deploymentId} --output json`
    : 'vercel logs --output json';
  
  console.log(`Fetching logs${deploymentId ? ` for deployment ${deploymentId}` : ' (latest)'}...\n`);
  const output = runCommand(cmd);
  return output.split('\n').filter(Boolean).map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return { raw: line };
    });
  });
}

function getFunctionLogs(functionId: string) {
  console.log(`Fetching function logs for ${functionId}...\n`);
  const output = runCommand(`vercel logs ${functionId} --output json`);
  return output.split('\n').filter(Boolean).map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return { raw: line };
    });
  });
}

function parseStructuredLogs(logs: any[]): LogEntry[] {
  return logs
    .filter(log => log.message || log.raw)
    .map(log => {
      const message = log.message || log.raw || '';
      
      // Try to parse JSON logs
      try {
        const parsed = JSON.parse(message);
        if (parsed.event || parsed.level) {
          return parsed as LogEntry;
        }
      } catch {
        // Not JSON, keep as raw
      }
      
      return {
        timestamp: log.timestamp || new Date().toISOString(),
        level: log.level || 'info',
        message: message,
        request_id: log.request_id,
      };
    });
}

function filterByRequestId(logs: LogEntry[], requestId: string): LogEntry[] {
  return logs.filter(log => log.request_id === requestId);
}

function groupByEvent(logs: LogEntry[]): Map<string, LogEntry[]> {
  const grouped = new Map<string, LogEntry[]>();
  
  logs.forEach(log => {
    const event = (log as any).event || 'unknown';
    if (!grouped.has(event)) {
      grouped.set(event, []);
    }
    grouped.get(event)!.push(log);
  });
  
  return grouped;
}

function displayLogs(logs: LogEntry[], options: { requestId?: string; event?: string; limit?: number } = {}) {
  let filtered = logs;
  
  if (options.requestId) {
    filtered = filterByRequestId(filtered, options.requestId);
    console.log(`\n📋 Logs for Request ID: ${options.requestId}\n`);
  }
  
  if (options.event) {
    filtered = filtered.filter(log => (log as any).event === options.event);
    console.log(`\n📋 Logs for Event: ${options.event}\n`);
  }
  
  if (options.limit) {
    filtered = filtered.slice(-options.limit);
  }
  
  if (filtered.length === 0) {
    console.log('No logs found matching criteria.');
    return;
  }
  
  filtered.forEach(log => {
    const timestamp = log.timestamp || new Date().toISOString();
    const level = log.level || 'info';
    const event = (log as any).event || '';
    const requestId = log.request_id || '';
    
    const levelEmoji = {
      info: 'ℹ️',
      error: '❌',
      warn: '⚠️',
      debug: '🔍',
    }[level] || '📝';
    
    console.log(`${levelEmoji} [${timestamp}] ${event ? `[${event}]` : ''} ${requestId ? `[${requestId}]` : ''}`);
    console.log(`   ${log.message || JSON.stringify(log)}`);
    console.log('');
  });
  
  console.log(`\nTotal logs: ${filtered.length}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    // Check if vercel CLI is installed
    runCommand('vercel --version');
    
    // Check if authenticated
    try {
      runCommand('vercel whoami');
    } catch {
      console.error('❌ Not authenticated with Vercel. Run: vercel login');
      process.exit(1);
    }
    
    switch (command) {
      case 'deployments':
        const deployments = getDeployments();
        console.log('Recent Deployments:');
        console.log(JSON.stringify(deployments, null, 2));
        break;
        
      case 'logs':
        const deploymentId = args[1];
        const logs = getLogs(deploymentId);
        const structuredLogs = parseStructuredLogs(logs);
        
        const requestId = args.find(arg => arg.startsWith('--request-id='))?.split('=')[1];
        const event = args.find(arg => arg.startsWith('--event='))?.split('=')[1];
        const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
        
        displayLogs(structuredLogs, {
          requestId,
          event,
          limit: limit ? parseInt(limit) : undefined,
        });
        break;
        
      case 'stats':
        const allLogs = getLogs();
        const parsed = parseStructuredLogs(allLogs);
        const grouped = groupByEvent(parsed);
        
        console.log('\n📊 Log Statistics:\n');
        console.log(`Total log entries: ${parsed.length}`);
        console.log(`Unique events: ${grouped.size}`);
        console.log('\nEvents breakdown:');
        grouped.forEach((logs, event) => {
          console.log(`  ${event}: ${logs.length} entries`);
        });
        
        const requestIds = new Set(parsed.map(log => log.request_id).filter(Boolean));
        console.log(`\nUnique request IDs: ${requestIds.size}`);
        break;
        
      case 'trace':
        const traceRequestId = args[1];
        if (!traceRequestId) {
          console.error('Usage: tsx scripts/inspect-vercel-logs.ts trace <request-id>');
          process.exit(1);
        }
        
        const traceLogs = getLogs();
        const traceParsed = parseStructuredLogs(traceLogs);
        displayLogs(traceParsed, { requestId: traceRequestId });
        break;
        
      default:
        console.log(`
Vercel Logs Inspector

Usage:
  tsx scripts/inspect-vercel-logs.ts <command> [options]

Commands:
  deployments                    List recent deployments
  logs [deployment-id]           Show logs (optionally for specific deployment)
  logs --request-id=<id>         Filter logs by request ID
  logs --event=<event>           Filter logs by event name
  logs --limit=<n>               Limit to last N logs
  stats                          Show log statistics
  trace <request-id>             Trace a specific request ID

Examples:
  tsx scripts/inspect-vercel-logs.ts logs
  tsx scripts/inspect-vercel-logs.ts logs --request-id=abc-123
  tsx scripts/inspect-vercel-logs.ts logs --event=request_completed
  tsx scripts/inspect-vercel-logs.ts trace abc-123-def-456
  tsx scripts/inspect-vercel-logs.ts stats
        `);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
