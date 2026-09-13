import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseEnvFile} from '../lib/env.mjs';

test('parseEnvFile reads quoted values, export prefix, and skips comments', () => {
  const parsed = parseEnvFile([
    '# comment',
    '',
    'SITE_URL=https://andilembele.com',
    'export FIREBASE_PROJECT_ID="andile-portfolio-personal"',
    "CMS_ADMIN_EMAILS='a@example.com,b@example.com'",
    'not a line',
    'lowercase=skip',
  ].join('\n'));
  assert.equal(parsed.SITE_URL, 'https://andilembele.com');
  assert.equal(parsed.FIREBASE_PROJECT_ID, 'andile-portfolio-personal');
  assert.equal(parsed.CMS_ADMIN_EMAILS, 'a@example.com,b@example.com');
  assert.equal(parsed.lowercase, undefined);
});
