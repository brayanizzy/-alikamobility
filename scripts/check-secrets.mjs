#!/usr/bin/env node
/**
 * Secret scanner for ALIKA MOBILITY
 *
 * Scans tracked files for dangerous patterns.
 * Usage: node scripts/check-secrets.mjs
 * Exit code: 0 if clean, 1 if secrets found
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const DANGEROUS_PATTERNS = [
  { pattern: /Alika@2025/, severity: 'high', name: 'Fallback password' },
  { pattern: /alika-cron-secret/, severity: 'high', name: 'Fallback cron secret' },
  { pattern: /hmac-dev-fallback/, severity: 'high', name: 'Fallback HMAC secret' },
  { pattern: /SFTP_PASS\s*=\s*['"][^'"]+['"]/, severity: 'high', name: 'SFTP password' },
  { pattern: /DB_PASS\s*=\s*['"][^'"]+['"]/, severity: 'high', name: 'DB password' },
  { pattern: /BREVO_API_KEY\s*=\s*['"][^'"]+['"]/, severity: 'high', name: 'Brevo API key' },
  { pattern: /WHATSAPP_TOKEN\s*=\s*['"][^'"]+['"]/, severity: 'high', name: 'WhatsApp token' },
  { pattern: /SMS_API_KEY\s*=\s*['"][^'"]+['"]/, severity: 'high', name: 'SMS API key' },
  { pattern: /BEGIN OPENSSH PRIVATE KEY/, severity: 'critical', name: 'SSH private key' },
  { pattern: /BEGIN RSA PRIVATE KEY/, severity: 'critical', name: 'RSA private key' },
  { pattern: /PRIVATE KEY-----/, severity: 'critical', name: 'Private key fragment' },
];

// Skip documentation files (AGENTS.md, README, etc.) from content scanning
const SKIP_FILES = [/\.md$/i, /\.txt$/i];

const BLOCKED_FILES = [
  '.env',
  '.env.local',
  'sshkey.txt',
  'api-test.php',
  'run-api-test.mjs',
];

const BLOCKED_PATTERNS = [
  /\.pem$/,
  /\.key$/,
  /\.ppk$/,
  /-backup-.*\.sql$/,
  /\.dump\.sql$/,
];

function getTrackedFiles() {
  try {
    const output = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return output.split('\n').filter(Boolean);
  } catch {
    console.warn('⚠️  Not a Git repository or Git not available. Falling back to file glob.');
    return [];
  }
}

function checkFile(filePath) {
  const relativePath = relative(ROOT, filePath).replace(/\\/g, '/');
  const basename = relativePath.split(/[\\/]/).pop();
  const issues = [];

  // Check against blocked file patterns
  if (BLOCKED_FILES.includes(basename)) {
    issues.push({ severity: 'critical', name: 'Blocked file in repo', detail: basename });
  }

  for (const bp of BLOCKED_PATTERNS) {
    if (bp.test(basename)) {
      issues.push({ severity: 'high', name: 'Blocked file pattern', detail: basename });
    }
  }

  // Skip documentation/markdown files from content scanning
  const isDoc = SKIP_FILES.some(p => p.test(relativePath) || p.test(basename));

  // Check file contents (skip docs and large files)
  try {
    const stat = existsSync(filePath) ? '' : '';
    const content = readFileSync(filePath, 'utf8');
    // Skip content check for markdown/doc files
    if (!isDoc) {
      for (const dp of DANGEROUS_PATTERNS) {
        if (dp.pattern.test(content)) {
          issues.push({ severity: dp.severity, name: dp.name, detail: relativePath });
        }
      }
    }
  } catch {
    // binary or unreadable
  }

  return issues;
}

const allIssues = [];
const trackedFiles = getTrackedFiles();

if (trackedFiles.length > 0) {
  for (const file of trackedFiles) {
    const fullPath = join(ROOT, file);
    if (!existsSync(fullPath)) continue;
    const issues = checkFile(fullPath);
    allIssues.push(...issues);
  }
}

console.log('=== Secret Scanner ===\n');

if (allIssues.length === 0) {
  console.log('✅ Aucun secret suspect détecté.');
  process.exit(0);
}

for (const issue of allIssues) {
  const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : '🟡';
  console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.name}: ${issue.detail}`);
}

console.log(`\n⚠️  ${allIssues.length} problème(s) détecté(s).`);
process.exit(1);
