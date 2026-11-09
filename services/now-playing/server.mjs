import assert from 'node:assert/strict';
import http from 'node:http';
import { createClient } from './spotify.mjs';

// Behind nginx at https://andilembele.com/api/now-playing. Credentials come from the systemd EnvironmentFile.
const PORT = Number(process.env.PORT || 4180);
assert.ok(Number.isInteger(PORT) && PORT > 0 && PORT < 65536, 'PORT must be a valid port');

function env(name) {
  const value = process.env[name];
  assert.ok(typeof value === 'string' && value.trim() !== '', `Missing ${name}`);
  return value.trim();
}

const client = createClient({ clientId: env('SPOTIFY_CLIENT_ID'), clientSecret: env('SPOTIFY_CLIENT_SECRET'), refreshToken: env('SPOTIFY_REFRESH_TOKEN') });

function send(res, status, value, cacheControl = 'no-store') {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl, 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(value));
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' || new URL(req.url, 'http://localhost').pathname !== '/api/now-playing') {
    send(res, 404, { error: 'Not found' });
    return;
  }
  try {
    send(res, 200, await client.nowPlaying(), 'public, max-age=15');
  } catch (error) {
    console.error(error);
    send(res, 502, { error: 'Spotify is unavailable' });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`now-playing listening on 127.0.0.1:${PORT}`));
