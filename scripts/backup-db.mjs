#!/usr/bin/env node
/**
 * Secure database backup for ALIKA MOBILITY
 *
 * Reads credentials from environment variables.
 * NEVER hardcode passwords in this file.
 *
 * Usage:
 *   DB_HOST=... DB_NAME=... DB_USER=... DB_PASS=... node scripts/backup-db.mjs
 *
 * Or create a .env.local file in apps/api/ and use:
 *   node -r dotenv/config scripts/backup-db.mjs
 *
 * Output: backups/alika-mobility-backup-YYYYMMDD-HHMMSS.sql
 */

import { execSync } from 'child_process';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BACKUP_DIR = join(ROOT, 'backups');

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
const missing = required.filter(k => !process.env[k]);

if (missing.length > 0) {
  console.error(`❌ Variables d'environnement manquantes: ${missing.join(', ')}`);
  console.error('   Usage: DB_HOST=... DB_NAME=... DB_USER=... DB_PASS=... node scripts/backup-db.mjs');
  process.exit(1);
}

if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

const now = new Date();
const ts = now.getFullYear()
  + String(now.getMonth() + 1).padStart(2, '0')
  + String(now.getDate()).padStart(2, '0') + '-'
  + String(now.getHours()).padStart(2, '0')
  + String(now.getMinutes()).padStart(2, '0')
  + String(now.getSeconds()).padStart(2, '0');

const filename = `alika-mobility-backup-${ts}.sql`;
const outputPath = join(BACKUP_DIR, filename);

console.log(`📦 Sauvegarde DB vers ${outputPath}...`);

try {
  execSync(
    `mysqldump --single-transaction --routines --triggers ` +
    `--host="${process.env.DB_HOST}" ` +
    `--user="${process.env.DB_USER}" ` +
    `--password="${process.env.DB_PASS}" ` +
    `"${process.env.DB_NAME}" > "${outputPath}"`,
    { stdio: 'inherit', timeout: 120000 }
  );
  console.log(`✅ Sauvegarde terminée: ${filename} (${(existsSync(outputPath) ? require('fs').statSync(outputPath).size : 0) / 1024} KB)`);
} catch (err) {
  console.error('❌ Erreur de sauvegarde:', err.message);
  process.exit(1);
}
