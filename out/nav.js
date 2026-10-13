const MAX_NAV_LINKS = 16;
const DEFAULT_MARKER_Y = 160;
const BOTTOM_THRESHOLD_PX = 4;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Pull the section id from a nav href such as "#work" or "/#contact".
 */
export function sectionIdFromHref(href) {
  assert(typeof href === 'string' || href == null, 'href must be a string or null');
  if (typeof href !== 'string') return null;
  const hashIndex = href.indexOf('#');
  if (hashIndex === -1) return null;
  const id = href.slice(hashIndex + 1);
  if (!id || id.includes('/') || id.includes('?')) return null;
  return id;
}

/**
 * Pair topbar hash links with on-page sections, in document order.
 */
export function sectionTargets(nav, root) {
  assert(nav, 'nav element is required');
  assert(root && typeof root.getElementById === 'function', 'document is required');
  const anchors = nav.querySelectorAll('a[href]');
  const count = Math.min(anchors.length, MAX_NAV_LINKS);
  const targets = [];
  for (let i = 0; i < count; i += 1) {
    const link = anchors[i];
    const id = sectionIdFromHref(link.getAttribute('href'));
    if (!id) continue;
    const section = root.getElementById(id);
    if (!section) continue;
    targets.push({ link, id, section });
  }
  return targets;
}

/**
 * Choose the section that currently owns the reading position.
 * At the top of the page (intro) nothing is current; near the bottom, Contact wins.
 */
export function activeSectionId(positions, viewport) {
  assert(Array.isArray(positions), 'positions must be an array');
  assert(viewport && Number.isFinite(viewport.height), 'viewport height is required');
  const count = Math.min(positions.length, MAX_NAV_LINKS);
  if (count === 0) return null;

  const markerY = Number.isFinite(viewport.markerY) ? viewport.markerY : DEFAULT_MARKER_Y;
  const nearBottom = Number.isFinite(viewport.documentHeight)
    && Number.isFinite(viewport.scrollY)
    && viewport.scrollY + viewport.height >= viewport.documentHeight - BOTTOM_THRESHOLD_PX;
  if (nearBottom) return positions[count - 1].id;

  let currentId = null;
  for (let i = 0; i < count; i += 1) {
    const position = positions[i];
    assert(typeof position.id === 'string', 'each position needs an id');
    if (position.top <= markerY) currentId = position.id;
  }
  return currentId;
}

/**
 * Mark the matching hash link as current without touching page-level aria-current.
 */
export function applyCurrent(targets, activeId) {
  assert(Array.isArray(targets), 'targets must be an array');
  const count = Math.min(targets.length, MAX_NAV_LINKS);
  let applied = 0;
  for (let i = 0; i < count; i += 1) {
    const target = targets[i];
    const link = target.link;
    if (link.getAttribute('aria-current') === 'page') continue;
    if (target.id === activeId) {
      link.setAttribute('aria-current', 'true');
      applied += 1;
    } else {
      link.removeAttribute('aria-current');
    }
  }
  assert(applied <= 1, 'at most one in-page nav item can be current');
  return applied;
}

function readPositions(targets) {
  const count = Math.min(targets.length, MAX_NAV_LINKS);
  const positions = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const target = targets[i];
    positions[i] = { id: target.id, top: target.section.getBoundingClientRect().top };
  }
  return positions;
}

function currentViewport(view, root) {
  return {
    scrollY: view.scrollY,
    height: view.innerHeight,
    documentHeight: root.documentElement.scrollHeight,
    markerY: DEFAULT_MARKER_Y,
  };
}

/**
 * Watch homepage sections and move the nav highlight as the visitor scrolls.
 */
export function bindSectionNav(nav, root, view) {
  assert(nav, 'nav element is required');
  assert(root, 'document is required');
  assert(view && typeof view.requestAnimationFrame === 'function', 'window is required');
  const targets = sectionTargets(nav, root);
  if (targets.length === 0) return () => {};

  let ticking = false;
  let frame = 0;
  const sync = () => {
    ticking = false;
    frame = 0;
    applyCurrent(targets, activeSectionId(readPositions(targets), currentViewport(view, root)));
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    frame = view.requestAnimationFrame(sync);
  };
  const onClick = (event) => {
    const origin = event.target;
    if (!origin || typeof origin.closest !== 'function') return;
    const link = origin.closest('a[href]');
    if (!link || !nav.contains(link)) return;
    const id = sectionIdFromHref(link.getAttribute('href'));
    if (!id) return;
    applyCurrent(targets, id);
  };

  nav.addEventListener('click', onClick);
  view.addEventListener('scroll', onScroll, { passive: true });
  view.addEventListener('resize', onScroll);
  view.addEventListener('hashchange', onScroll);
  sync();
  return () => {
    if (frame) view.cancelAnimationFrame(frame);
    nav.removeEventListener('click', onClick);
    view.removeEventListener('scroll', onScroll);
    view.removeEventListener('resize', onScroll);
    view.removeEventListener('hashchange', onScroll);
  };
}

if (typeof document !== 'undefined') {
  const nav = document.querySelector('.topbar nav[aria-label="Main navigation"]');
  if (nav) bindSectionNav(nav, document, window);
}
