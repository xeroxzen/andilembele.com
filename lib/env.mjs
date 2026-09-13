import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const MAX_ENV_LINES = 200;
const ENV_KEY = /^[A-Z_][A-Z0-9_]*$/;
const FIREBASE_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MESSAGING_SENDER_ID',
];

/**
 * Strip matching single or double quotes from a .env value.
 */
function unquote(value) {
  assert.equal(typeof value, 'string', 'unquote: value must be a string');
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.length >= 2 && value.endsWith(quote)) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Parse KEY=value lines from a .env file body. Existing comments and blank lines are ignored.
 */
export function parseEnvFile(text) {
  assert.equal(typeof text, 'string', 'parseEnvFile: text must be a string');
  const parsed = {};
  const lines = text.split(/\r?\n/);
  const lineCount = Math.min(lines.length, MAX_ENV_LINES);
  for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
    const line = lines[lineIndex].trim();
    if (!line || line.startsWith('#')) continue;
    const assignment = line.startsWith('export ') ? line.slice(7).trim() : line;
    const separatorIndex = assignment.indexOf('=');
    if (separatorIndex < 1) continue;
    const key = assignment.slice(0, separatorIndex).trim();
    if (!ENV_KEY.test(key)) continue;
    parsed[key] = unquote(assignment.slice(separatorIndex + 1).trim());
  }
  return parsed;
}

/**
 * Load `.env` from the repo root into process.env without overwriting values already set.
 */
export function loadEnv() {
  const envPath = fileURLToPath(new URL('../.env', import.meta.url));
  let text;
  try {
    text = readFileSync(envPath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return;
    throw error;
  }
  const parsed = parseEnvFile(text);
  const keys = Object.keys(parsed);
  assert.ok(keys.length <= MAX_ENV_LINES, 'loadEnv: .env has too many keys');
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const key = keys[keyIndex];
    if (process.env[key] === undefined) process.env[key] = parsed[key];
  }
}

/**
 * Return a required environment variable, or throw with the missing name.
 */
export function requireEnv(name) {
  assert.ok(typeof name === 'string' && name.length > 0, 'requireEnv: name is required');
  const value = process.env[name];
  assert.ok(typeof value === 'string' && value.trim() !== '', `Missing ${name} in .env`);
  return value.trim();
}

/**
 * Parse the comma-separated CMS administrator allowlist.
 */
export function adminEmails() {
  const emails = requireEnv('CMS_ADMIN_EMAILS').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
  assert.ok(emails.length >= 1, 'CMS_ADMIN_EMAILS must list at least one address');
  assert.ok(emails.length <= 20, 'CMS_ADMIN_EMAILS exceeds the allowlist bound');
  for (let emailIndex = 0; emailIndex < emails.length; emailIndex += 1) {
    const email = emails[emailIndex];
    assert.ok(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), `Invalid admin email: ${email}`);
  }
  return emails;
}

/**
 * Firebase web app config used when bundling the production CMS.
 */
export function firebaseConfig() {
  return {
    apiKey: requireEnv('FIREBASE_API_KEY'),
    authDomain: requireEnv('FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv('FIREBASE_PROJECT_ID'),
    appId: requireEnv('FIREBASE_APP_ID'),
    messagingSenderId: requireEnv('FIREBASE_MESSAGING_SENDER_ID'),
  };
}

/**
 * esbuild `define` map so the browser bundle receives Firebase values at build time.
 */
export function esbuildDefines() {
  const keys = FIREBASE_KEYS.concat(['CMS_ADMIN_EMAILS']);
  const define = {};
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const key = keys[keyIndex];
    define[`process.env.${key}`] = JSON.stringify(requireEnv(key));
  }
  return define;
}

loadEnv();
