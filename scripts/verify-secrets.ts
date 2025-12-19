#!/usr/bin/env tsx
/**
 * Secret verification script
 * Scans tracked source files for accidental secret commits
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const SECRET_PATTERNS = [
  /OPENAI_API_KEY\s*=\s*sk-proj-/i,
  /OPENAI_API_KEY\s*=\s*sk-[a-zA-Z0-9]{20,}/i,
  /DATABASE_URL\s*=\s*postgresql:\/\/[^@]+@[^\/]+\/[^\s"']+/i,
  /password\s*[:=]\s*['"][^'"]{10,}['"]/i,
];

// Patterns that indicate placeholders (not real secrets)
const PLACEHOLDER_PATTERNS = [
  /your[_-]?openai[_-]?api[_-]?key/i,
  /your[_-]?key[_-]?here/i,
  /sk-your/i,
  /user:password@host/i,
  /example\.com/i,
  /placeholder/i,
  /your[_-]?database[_-]?url/i,
];

const EXCLUDE_PATTERNS = [
  /\.env\.example$/,
  /node_modules/,
  /\.next/,
  /package-lock\.json$/,
  /\.git/,
];

function getTrackedFiles(): string[] {
  try {
    const output = execSync('git ls-files', { encoding: 'utf-8' });
    return output
      .split('\n')
      .filter(line => line.trim())
      .filter(file => {
        // Only check source files
        return /\.(ts|tsx|js|jsx|md|json|yml|yaml|sh)$/.test(file);
      })
      .filter(file => {
        // Exclude patterns
        return !EXCLUDE_PATTERNS.some(pattern => pattern.test(file));
      });
  } catch (error) {
    console.error('Error getting tracked files:', error);
    return [];
  }
}

function scanFile(filePath: string): Array<{ line: number; content: string; pattern: string }> {
  const issues: Array<{ line: number; content: string; pattern: string }> = [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip if line contains placeholder indicators
      if (PLACEHOLDER_PATTERNS.some(pattern => pattern.test(line))) {
        return;
      }
      
      SECRET_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            pattern: pattern.toString(),
          });
        }
      });
    });
  } catch (error) {
    // File might not exist or be binary, skip
  }
  
  return issues;
}

function main() {
  console.log('🔍 Scanning tracked files for secrets...\n');
  
  const trackedFiles = getTrackedFiles();
  let foundIssues = false;
  
  trackedFiles.forEach(file => {
    const issues = scanFile(file);
    if (issues.length > 0) {
      foundIssues = true;
      console.error(`❌ ${file}:`);
      issues.forEach(issue => {
        console.error(`   Line ${issue.line}: ${issue.content.substring(0, 80)}...`);
      });
      console.error('');
    }
  });
  
  if (foundIssues) {
    console.error('⚠️  Potential secrets found in tracked files!');
    console.error('   Remove them immediately and rotate any exposed keys.');
    process.exit(1);
  } else {
    console.log('✅ No secrets found in tracked files');
    process.exit(0);
  }
}

main();
