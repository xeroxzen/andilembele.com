// Fade blocks in as they scroll into view. Only blocks still below the fold are hidden, and only once this
// script runs, so a failed script or a reduced-motion setting never leaves content invisible.

const MAX_BLOCKS = 300;

export function initReveal(doc) {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fold = window.innerHeight;
  const pending = [...doc.querySelectorAll('.reveal')].slice(0, MAX_BLOCKS).filter((el) => el.getBoundingClientRect().top > fold);
  if (!pending.length) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('reveal-pending');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  for (const el of pending) {
    el.classList.add('reveal-pending');
    observer.observe(el);
  }
}
