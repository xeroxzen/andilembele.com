import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import http from 'node:http';
import { loadEnv, requireEnv } from '../../lib/env.mjs';

// One-time: run locally, log in to Spotify in the browser, and copy the printed refresh token
// into /etc/now-playing.env on the server. Spotify only accepts loopback redirects as 127.0.0.1.
loadEnv();
const PORT = 8888;
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = 'user-read-currently-playing user-read-recently-played';
const TIMEOUT_MS = 5 * 60 * 1000;
const clientId = requireEnv('SPOTIFY_CLIENT_ID'), clientSecret = requireEnv('SPOTIFY_CLIENT_SECRET');
const state = randomBytes(16).toString('hex');

async function exchange(code) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT }),
  });
  const data = await response.json();
  assert.ok(response.ok && typeof data.refresh_token === 'string', 'Token exchange failed: ' + JSON.stringify(data));
  return data.refresh_token;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== '/callback') { res.writeHead(404).end(); return; }
  try {
    assert.equal(url.searchParams.get('state'), state, 'State mismatch; start again');
    const code = url.searchParams.get('code');
    assert.ok(code, 'Spotify returned: ' + (url.searchParams.get('error') || 'no code'));
    const refreshToken = await exchange(code);
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Authorized. Return to the terminal.');
    console.log('\nSPOTIFY_REFRESH_TOKEN=' + refreshToken + '\n');
    process.exitCode = 0;
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end(String(error.message));
    console.error(error.message);
    process.exitCode = 1;
  }
  server.close();
});

server.listen(PORT, '127.0.0.1', () => {
  const query = new URLSearchParams({ response_type: 'code', client_id: clientId, scope: SCOPES, redirect_uri: REDIRECT, state });
  console.log('Open this URL and approve access:\n\nhttps://accounts.spotify.com/authorize?' + query);
});
setTimeout(() => { console.error('Timed out waiting for Spotify.'); process.exit(1); }, TIMEOUT_MS).unref();
