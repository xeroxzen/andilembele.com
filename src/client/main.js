// Entry point for /site.js on every public page.
import { createMenu, shortcutFor } from './menu.js';
import { applyTheme, currentTheme, effectiveTheme, toggledTheme } from './theme.js';
import { initDatabase } from './database.js';
import { initReveal } from './reveal.js';
import { initMotion } from './motion.js';
import { initActions, copyText, toast } from './actions.js';
import './now-playing.js';
import './playlist.js';

const isMac = /mac|iphone|ipad/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? '');
const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

function syncThemeToggles() {
  const dark = effectiveTheme(currentTheme(), prefersDark()) === 'dark';
  for (const button of document.querySelectorAll('[data-theme-toggle]')) button.setAttribute('aria-pressed', String(dark));
}

function runAction(action, value) {
  if (action === 'go') {
    if (/^https:/.test(value) || value.endsWith('.pdf')) window.open(value, '_blank', 'noopener');
    else window.location.assign(value);
  } else if (action === 'copy') {
    copyText(value, 'Email address');
  } else if (action === 'theme') {
    const next = value === 'system' ? null : toggledTheme(currentTheme(), prefersDark());
    applyTheme(next);
    syncThemeToggles();
    toast(next ? `${next[0].toUpperCase()}${next.slice(1)} theme on.` : 'Following the system theme.');
  } else {
    throw new Error('Unknown menu action ' + action);
  }
}

function initMenus() {
  const menus = {};
  for (const id of ['palette', 'slash']) {
    const dialog = document.getElementById(id);
    if (dialog) menus[id] = createMenu(dialog, runAction);
  }
  document.addEventListener('keydown', (event) => {
    const which = shortcutFor(event);
    if (!which || !menus[which] || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    menus[which].open();
  });
  for (const button of document.querySelectorAll('[data-palette-open]')) button.addEventListener('click', () => menus.palette?.open());
  for (const key of document.querySelectorAll('[data-mod-key]')) key.textContent = isMac ? '⌘' : 'Ctrl';
}

initMenus();
for (const button of document.querySelectorAll('[data-theme-toggle]')) button.addEventListener('click', () => runAction('theme', 'toggle'));
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeToggles);
syncThemeToggles();
for (const root of document.querySelectorAll('[data-database]')) initDatabase(root);
initActions(document);
initReveal(document);
initMotion(document);
