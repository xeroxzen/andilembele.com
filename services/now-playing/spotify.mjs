import assert from 'node:assert/strict';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const PLAYER_URL = 'https://api.spotify.com/v1/me/player';
// Every visitor polls, so the cache caps Spotify calls at two a minute however busy the page is.
export const CACHE_MS = 30_000;
const TOKEN_MARGIN_MS = 60_000;
const ART_WIDTH = 300;

const trusted = (value, prefix) => (typeof value === 'string' && value.startsWith(prefix) ? value : null);

/**
 * The public fields of a Spotify track object, or null for episodes, ads, and missing items.
 */
export function shapeTrack(item) {
  if (!item || item.type !== 'track' || typeof item.name !== 'string') return null;
  const images = Array.isArray(item.album?.images) ? item.album.images : [];
  // Spotify lists album art widest first; take the first one small enough, else the smallest.
  const art = images.find((image) => image.width <= ART_WIDTH) || images.at(-1);
  return {
    title: item.name,
    artists: (Array.isArray(item.artists) ? item.artists : []).map((artist) => artist.name).filter((name) => typeof name === 'string').join(', '),
    url: trusted(item.external_urls?.spotify, 'https://open.spotify.com/'),
    image: trusted(art?.url, 'https://i.scdn.co/'),
  };
}

async function spotifyJSON(fetch, url, init) {
  const response = await fetch(url, init);
  if (response.status === 204) return null;
  if (!response.ok) throw Error(`Spotify ${new URL(url).pathname} returned HTTP ${response.status}`);
  return response.json();
}

/**
 * Now-playing client for one Spotify account. `fetch` and `now` are injectable for tests.
 */
export function createClient({ clientId, clientSecret, refreshToken, fetch = globalThis.fetch, now = Date.now }) {
  assert.ok(clientId && clientSecret && refreshToken, 'createClient: Spotify credentials are required');
  const basic = Buffer.from(clientId + ':' + clientSecret).toString('base64');
  let token = null, tokenExpiresAt = 0, cached = null, cachedAt = 0, pending = null;

  async function accessToken() {
    if (token && now() < tokenExpiresAt - TOKEN_MARGIN_MS) return token;
    const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken });
    const data = await spotifyJSON(fetch, TOKEN_URL, { method: 'POST', headers: { Authorization: 'Basic ' + basic, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    assert.ok(data && typeof data.access_token === 'string' && Number.isFinite(data.expires_in), 'Spotify token response is malformed');
    // Spotify may rotate the refresh token; keep the newest for this process. The env file keeps the original.
    if (typeof data.refresh_token === 'string') refreshToken = data.refresh_token;
    token = data.access_token;
    tokenExpiresAt = now() + data.expires_in * 1000;
    return token;
  }

  async function load() {
    const headers = { Authorization: 'Bearer ' + (await accessToken()) };
    const current = await spotifyJSON(fetch, PLAYER_URL + '/currently-playing?additional_types=track', { headers });
    const playing = current?.is_playing ? shapeTrack(current.item) : null;
    if (playing) return { playing: true, track: playing };
    const recent = await spotifyJSON(fetch, PLAYER_URL + '/recently-played?limit=1', { headers });
    const last = recent?.items?.[0];
    return { playing: false, track: shapeTrack(last?.track), playedAt: typeof last?.played_at === 'string' ? last.played_at : null };
  }

  /**
   * Current track, or the last played one. Serves the previous answer if Spotify fails after a success.
   */
  async function nowPlaying() {
    if (cached && now() - cachedAt < CACHE_MS) return cached;
    pending ??= load().then((value) => { cached = value; cachedAt = now(); return value; }).finally(() => { pending = null; });
    try {
      return await pending;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  }

  return { nowPlaying };
}
