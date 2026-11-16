// Manual theme choice. theme-init.js applies the saved choice before first paint; this module changes it.

const KEY = 'theme';

export function effectiveTheme(saved, prefersDark) {
  if (saved === 'light' || saved === 'dark') return saved;
  return prefersDark ? 'dark' : 'light';
}

export function toggledTheme(saved, prefersDark) {
  return effectiveTheme(saved, prefersDark) === 'dark' ? 'light' : 'dark';
}

/**
 * Apply a theme ('light', 'dark', or null for the system setting) and remember it.
 */
export function applyTheme(value) {
  if (value !== null && value !== 'light' && value !== 'dark') throw new Error('applyTheme: unknown theme ' + value);
  const root = document.documentElement;
  if (value) root.dataset.theme = value;
  else delete root.dataset.theme;
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage is blocked (private mode or site data disabled): the choice lasts until the page reloads.
  }
}

export function currentTheme() {
  return document.documentElement.dataset.theme ?? null;
}
