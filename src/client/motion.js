// Interactive motion: pointer depth on the hero art, a spotlight that follows the pointer on cards,
// and numbers that count up when they come into view. All of it is skipped for reduced motion.

const MAX_TARGETS = 200;
const COUNT_MS = 1200;

/**
 * Pointer position inside a box as -1..1 on each axis, clamped.
 */
export function pointerRatio(clientX, clientY, rect) {
  if (!(rect.width > 0 && rect.height > 0)) return { x: 0, y: 0 };
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  return { x: clamp(((clientX - rect.left) / rect.width) * 2 - 1), y: clamp(((clientY - rect.top) / rect.height) * 2 - 1) };
}

/**
 * Value shown at progress t (0..1) when counting up to `target`, with an ease-out curve.
 */
export function countAt(target, t) {
  const clamped = Math.max(0, Math.min(1, t));
  return Math.round(target * (1 - Math.pow(1 - clamped, 3)));
}

function initDepth(doc) {
  const hero = doc.querySelector('.hero');
  const art = hero?.querySelector('.art');
  if (!art) return;
  hero.addEventListener('pointermove', (event) => {
    const { x, y } = pointerRatio(event.clientX, event.clientY, hero.getBoundingClientRect());
    art.style.setProperty('--px', x.toFixed(3));
    art.style.setProperty('--py', y.toFixed(3));
  });
  hero.addEventListener('pointerleave', () => { art.style.setProperty('--px', '0'); art.style.setProperty('--py', '0'); });
}

function initSpotlight(doc) {
  for (const el of [...doc.querySelectorAll('.card, .role-card, .principle')].slice(0, MAX_TARGETS)) {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      el.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  }
}

function countUp(el) {
  const target = Number(el.dataset.countTo);
  const suffix = el.dataset.suffix ?? '';
  const start = performance.now();
  const frame = (now) => {
    const t = (now - start) / COUNT_MS;
    el.textContent = countAt(target, t) + suffix;
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function initCountUp(doc) {
  const targets = [...doc.querySelectorAll('[data-count-to]')].slice(0, MAX_TARGETS);
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      countUp(entry.target);
    }
  }, { threshold: 0.6 });
  for (const el of targets) observer.observe(el);
}

export function initMotion(doc) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // SMIL animations ignore the media query, so the packets are paused by hand.
  if (reduced) {
    for (const svg of doc.querySelectorAll('svg.art')) svg.pauseAnimations?.();
    return;
  }
  initDepth(doc);
  initSpotlight(doc);
  initCountUp(doc);
}
