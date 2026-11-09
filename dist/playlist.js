const PLAYLIST_ID = /^[A-Za-z0-9]{22}$/;
const PLAYER_HEIGHT = 152;

/**
 * Spotify embed address for a playlist ID, or null if the ID is not a Spotify ID.
 */
export function embedURL(id) {
  if (typeof id !== 'string' || !PLAYLIST_ID.test(id)) return null;
  return `https://open.spotify.com/embed/playlist/${id}?theme=0`;
}

function openPlayer(root, link) {
  const src = embedURL(root.dataset.playlistId);
  if (!src) return false;
  const frame = document.createElement('iframe');
  Object.assign(frame, { src, title: 'Spotify playlist player', width: '100%', height: String(PLAYER_HEIGHT), loading: 'lazy', className: 'playlist-player' });
  frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  const close = document.createElement('button');
  Object.assign(close, { type: 'button', className: 'playlist-close', textContent: 'Hide player' });
  close.addEventListener('click', () => {
    root.replaceChildren(link);
    link.focus();
  });
  root.replaceChildren(frame, close);
  return true;
}

function start(root) {
  const link = root.querySelector('.playlist-link');
  if (!link) return;
  link.addEventListener('click', (event) => {
    // Modified clicks keep their usual meaning, such as opening Spotify in a new tab.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (openPlayer(root, link)) event.preventDefault();
  });
}

const root = globalThis.document?.querySelector('.playlist[data-playlist-id]');
if (root) start(root);
