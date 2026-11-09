const ENDPOINT = '/api/now-playing';
const POLL_MS = 30_000;

/**
 * What to show for an endpoint response, or null when there is nothing to show.
 */
export function describe(data) {
  const track = data?.track;
  if (!track || typeof track.title !== 'string' || !track.title) return null;
  return {
    label: data.playing ? 'Listening now on Spotify' : 'Last played on Spotify',
    playing: Boolean(data.playing),
    title: track.title,
    artists: typeof track.artists === 'string' ? track.artists : '',
    url: typeof track.url === 'string' && track.url.startsWith('https://open.spotify.com/') ? track.url : null,
    image: typeof track.image === 'string' && track.image.startsWith('https://i.scdn.co/') ? track.image : null,
  };
}

function span(className, text) {
  const node = document.createElement('span');
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function render(root, view) {
  if (!view) { root.hidden = true; root.replaceChildren(); return; }
  const link = document.createElement(view.url ? 'a' : 'span');
  link.className = 'now-playing-link';
  if (view.url) link.href = view.url;
  if (view.image) {
    const art = document.createElement('img');
    Object.assign(art, { src: view.image, alt: '', width: 40, height: 40, loading: 'lazy', className: 'now-playing-art' });
    link.append(art);
  }
  const label = span('now-playing-label', view.label);
  if (view.playing) label.prepend(span('now-playing-bars'));
  const text = span('now-playing-text');
  text.append(label, span('now-playing-track', view.artists ? `${view.title} — ${view.artists}` : view.title));
  link.append(text);
  root.replaceChildren(link);
  root.hidden = false;
}

async function refresh(root) {
  try {
    const response = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
    render(root, response.ok ? describe(await response.json()) : null);
  } catch {
    // Offline or the endpoint is down: the widget is decoration, so it just hides.
    render(root, null);
  }
}

function start(root) {
  let timer = null, inFlight = false;
  const tick = async () => {
    inFlight = true;
    await refresh(root);
    inFlight = false;
    timer = document.visibilityState === 'visible' ? setTimeout(tick, POLL_MS) : null;
  };
  // Polling stops while the tab is hidden and resumes when it is shown again.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && timer === null && !inFlight) tick();
  });
  tick();
}

const root = globalThis.document?.getElementById('now-playing');
if (root) start(root);
