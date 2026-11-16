import assert from 'node:assert/strict';
import { PALETTE } from '../lib/palette.mjs';
import { escapeHTML as e } from '../dist/blog/markdown.js';
import { renderFooter, socialLinks } from './footer.mjs';
import { renderSocialMeta } from './social-meta.mjs';

// The shell every page shares: head, header, the ⌘K palette, the "/" menu, and the footer.

export const NAV = [
  { href: '/projects/', label: 'Projects' },
  { href: '/blog/', label: 'Writing' },
  { href: '/now/', label: 'Now' },
  { href: '/about/', label: 'About' },
  { href: '/resume/', label: 'Resume' },
  { href: '/contact/', label: 'Contact' },
];
const SLASH = [
  { command: '/projects', href: '/projects/', label: 'Browse projects' },
  { command: '/resume', href: '/resume/', label: 'Read the résumé' },
  { command: '/contact', href: '/contact/', label: 'Get in touch' },
];
export const THEME_COLORS = { light: PALETTE.light.bg, dark: PALETTE.dark.bg };

// The moon shows in light mode and the sun in dark; CSS picks one, and /site.js keeps aria-pressed current.
const THEME_TOGGLE = '<button class="theme-toggle js-only" type="button" data-theme-toggle aria-pressed="false" aria-label="Dark theme"><svg class="theme-icon theme-icon-moon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="M16 12.5A6.5 6.5 0 0 1 7.5 4a6.5 6.5 0 1 0 8.5 8.5Z"/></svg><svg class="theme-icon theme-icon-sun" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="3.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"/></svg></button>';

/**
 * The <head> contents shared by every page. Scripts and stylesheets are versioned by build-sites.
 * theme-init.js is a classic, blocking script: it applies a saved theme before first paint.
 */
export function renderHead({ title, description }) {
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="${THEME_COLORS.light}" media="(prefers-color-scheme: light)"><meta name="theme-color" content="${THEME_COLORS.dark}" media="(prefers-color-scheme: dark)"><title>${e(title)}</title><meta name="description" content="${e(description)}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/styles.css"><script src="/theme-init.js"></script><script type="module" src="/site.js"></script>`;
}

/**
 * Site header. `current` is the nav href of the page being shown, or '' for none.
 */
export function renderHeader(current, mainId = 'main') {
  assert.ok(current === '' || NAV.some((item) => item.href === current), 'renderHeader: unknown current page ' + current);
  const links = NAV.map((item) => `<a href="${item.href}"${item.href === current ? ' aria-current="page"' : ''}>${item.label}</a>`).join('');
  return `<a class="skip" href="#${mainId}">Skip to content</a><header class="site-header"><div class="site-header-inner"><a class="wordmark" href="/"><span class="wordmark-mark" aria-hidden="true">A</span><span>Andile Jaden Mbele</span></a><nav class="site-nav" aria-label="Main">${links}</nav><button class="palette-trigger js-only" type="button" data-palette-open aria-keyshortcuts="Meta+K Control+K"><span class="palette-trigger-label">Search<span class="visually-hidden"> pages and actions</span></span><kbd data-mod-key aria-hidden="true">⌘</kbd><kbd aria-hidden="true">K</kbd></button>${THEME_TOGGLE}</div></header>`;
}

function option(id, { label, hint = '', keywords = '', action, value }) {
  return `<li role="option" id="${id}" class="menu-option" aria-selected="false" data-action="${action}" data-value="${e(value)}" data-keywords="${e(keywords)}"><span class="menu-label">${e(label)}</span>${hint ? `<span class="menu-hint">${e(hint)}</span>` : ''}</li>`;
}

function group(prefix, name, options) {
  return `<ul role="group" aria-label="${e(name)}" class="menu-group"><li role="presentation" class="menu-group-label">${e(name)}</li>${options.map((o, i) => option(`${prefix}-${i}`, o)).join('')}</ul>`;
}

function menuDialog({ id, label, placeholder, groups }) {
  return `<dialog class="menu menu-${id}" id="${id}" aria-label="${e(label)}"><div class="menu-search"><input type="text" role="combobox" aria-expanded="true" aria-controls="${id}-list" aria-autocomplete="list" aria-label="${e(label)}" placeholder="${e(placeholder)}" autocomplete="off" spellcheck="false"></div><div class="menu-list" id="${id}-list" role="listbox" aria-label="Results">${groups}</div><p class="menu-empty" hidden>No results.</p><p class="menu-footer" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></p></dialog>`;
}

/**
 * The ⌘K palette and the "/" menu. Options are rendered here; /site.js filters and runs them.
 */
export function renderMenus({ site, projects }) {
  const pages = [{ label: 'Home', action: 'go', value: '/', keywords: 'start index' }, ...NAV.map((item) => ({ label: item.label, action: 'go', value: item.href, keywords: item.label === 'Writing' ? 'blog posts articles' : '' }))];
  const work = projects.map((p) => ({ label: p.title, hint: p.domain, action: 'go', value: `/projects/${p.slug}/`, keywords: [p.domain, ...p.stack].join(' ') }));
  const github = socialLinks.find((link) => link.label === 'GitHub');
  const x = socialLinks.find((link) => link.label === 'X');
  assert.ok(github && x, 'renderMenus: GitHub and X links are required');
  const actions = [
    { label: 'Copy email address', hint: site.email, action: 'copy', value: site.email, keywords: 'contact mail' },
    { label: 'Toggle dark mode', action: 'theme', value: 'toggle', keywords: 'theme light dark appearance' },
    { label: 'Match system theme', action: 'theme', value: 'system', keywords: 'theme appearance auto' },
    { label: 'Download résumé (PDF)', action: 'go', value: site.resumePdf, keywords: 'resume cv pdf' },
    { label: 'Open GitHub', hint: 'github.com/xeroxzen', action: 'go', value: github.url, keywords: 'code repositories' },
    { label: 'Open X', hint: '@andilejaden', action: 'go', value: x.url, keywords: 'twitter social' },
  ];
  const palette = menuDialog({ id: 'palette', label: 'Command menu', placeholder: 'Search pages, projects, and actions…', groups: group('palette-page', 'Pages', pages) + group('palette-project', 'Projects', work) + group('palette-action', 'Actions', actions) });
  const slash = menuDialog({ id: 'slash', label: 'Quick jump', placeholder: 'Type a command…', groups: group('slash-cmd', 'Commands', SLASH.map((s) => ({ label: s.command, hint: s.label, action: 'go', value: s.href }))) });
  return palette + slash + '<p class="toast" id="toast" role="status" aria-live="polite"></p>';
}

/**
 * A complete page. `main` is the page's HTML; `page` feeds the link-preview tags (null means the homepage's).
 * A `noindex` page, such as the 404, gets no preview tags and asks crawlers to skip it.
 */
export function renderPage({ title, description, current, main, page, menus, mainClass = '', noindex = false }) {
  assert.ok(menus, 'renderPage: menus are required');
  const meta = noindex ? '<meta name="robots" content="noindex">' : renderSocialMeta({ page });
  const html = `<!doctype html><html lang="en"><head>${renderHead({ title, description })}${meta}</head><body>${renderHeader(current)}<main id="main" class="${e(mainClass)}" tabindex="-1">${main}</main>${renderFooter()}${menus}</body></html>`;
  assert.ok(!html.includes('{{'), 'renderPage: unreplaced placeholder');
  return html;
}

/**
 * Fill the blog template's shared parts. The footer, preview tags, and content are filled by the caller.
 */
export function renderBlogShell(template, menus) {
  assert.ok(template.includes('{{head}}') && template.includes('{{menus}}'), 'renderBlogShell: template is missing placeholders');
  return template
    .replace('{{head}}', () => renderHead({ title: 'Writing · Andile Jaden Mbele', description: 'Writing on software, infrastructure, and building products by Andile Jaden Mbele.' }))
    .replace('{{header}}', () => renderHeader('/blog/', 'app'))
    .replace('{{menus}}', () => menus);
}
