import assert from 'node:assert/strict';
import { escapeHTML as e } from '../dist/blog/markdown.js';
import { art } from './illustrations.mjs';

// Building blocks shared by every page. Each returns an HTML string; callers escape nothing themselves
// except where a parameter is documented as HTML.

const MAX_ITEMS = 200;
const STATUS_TONES = { Active: 'green', Live: 'blue', Shipped: 'purple', Archived: 'gray' };
const DOMAIN_TONES = {
  AI: 'purple', Data: 'blue', Security: 'red', Infrastructure: 'gray', Fintech: 'green', PropTech: 'yellow', Health: 'pink', Operations: 'brown', Hardware: 'orange',
  Work: 'blue', Venture: 'purple', Community: 'green',
  Release: 'orange', Product: 'green', 'Open source': 'blue', Internal: 'gray', Writing: 'pink',
  Book: 'brown', Paper: 'gray', 'Distributed systems': 'blue', Craft: 'green', Design: 'purple', Performance: 'orange', Correctness: 'red', Career: 'yellow', Startups: 'brown',
};
export const toneOf = (value) => DOMAIN_TONES[value] ?? 'gray';

/**
 * A page section. `inner` is HTML. Blocks show a drag handle on hover and fade in on scroll unless `reveal` is false.
 */
export function block(inner, { tag = 'section', className = '', reveal = true, label = '' } = {}) {
  assert.match(tag, /^(section|div|aside|article|figure)$/, 'block: unsupported tag');
  const classes = ['block', reveal ? 'reveal' : '', className].filter(Boolean).join(' ');
  return `<${tag} class="${classes}"${label ? ` aria-label="${e(label)}"` : ''}>${inner}</${tag}>`;
}

/**
 * A section heading with an optional "see all" link on the right.
 */
export function sectionHeading(text, { id = '', more = null } = {}) {
  const link = more ? `<a class="section-more" href="${e(more.href)}">${e(more.label)} <span aria-hidden="true">→</span></a>` : '';
  return `<div class="section-heading"><h2${id ? ` id="${e(id)}"` : ''}>${e(text)}</h2>${link}</div>`;
}

/**
 * Callout with a title. `body` is HTML. The classes match the Markdown renderer's callouts.
 */
export function callout({ title, body, tone = 'note' }) {
  assert.match(tone, /^(note|tip|important|warning|caution)$/, 'callout: unknown tone');
  return `<aside class="callout callout-${tone}"><p class="callout-title">${e(title)}</p>${body}</aside>`;
}

/**
 * Toggle block built on <details>, so it opens with the keyboard and without JavaScript. `body` is HTML.
 */
export function toggle(summary, body) {
  return `<details class="toggle"><summary>${e(summary)}</summary><div class="toggle-body">${body}</div></details>`;
}

export function quote(text, cite = '') {
  return `<figure class="quote"><blockquote><p>${e(text)}</p></blockquote>${cite ? `<figcaption>${e(cite)}</figcaption>` : ''}</figure>`;
}

export const divider = () => '<hr class="divider">';

/**
 * A coloured property value, as in a database cell. Tones follow the value so the same status is always the same colour.
 */
export function pill(text, tone = 'gray') {
  return `<span class="pill pill-${e(tone)}">${e(text)}</span>`;
}

export const statusPill = (status) => (status ? pill(status, STATUS_TONES[status] ?? 'gray') : '');
export const domainPill = (domain) => (domain ? pill(domain, DOMAIN_TONES[domain] ?? 'gray') : '');
export const tagPills = (tags) => tags.map((tag) => pill(tag)).join('');

/**
 * Square page icon: one or two letters on the cover colour.
 */
export function pageIcon(icon, cover, size = '') {
  return `<span class="page-icon cover-${e(cover)}${size ? ' page-icon-' + size : ''}" aria-hidden="true">${e(icon)}</span>`;
}

/**
 * Illustration slot holding inline line art from components/illustrations.mjs.
 */
export function illustration(name, { className = '' } = {}) {
  return `<figure class="illustration ${className}">${art(name)}</figure>`;
}

/**
 * Page header block: optional illustration, title, and a lead paragraph.
 */
export function pageHeader({ title, lead = '', art = null, eyebrow = '' }) {
  const picture = art ? illustration(art, { className: 'illustration-header' }) : '';
  return `<header class="page-header">${picture}${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1 class="page-title">${e(title)}</h1>${lead ? `<p class="lead">${e(lead)}</p>` : ''}</header>`;
}

/**
 * A titled list of links in Notion's list view. Items: { title, href, meta, external }.
 */
export function listView(items) {
  assert.ok(items.length <= MAX_ITEMS, 'listView: too many items');
  const row = (item) => {
    const target = item.external ? ' rel="noopener"' : '';
    const arrow = item.external ? '↗' : '→';
    return `<li><a class="list-row" href="${e(item.href)}"${target}><span class="list-title">${e(item.title)}</span><span class="list-meta">${e(item.meta)}</span><span class="list-arrow" aria-hidden="true">${arrow}</span></a></li>`;
  };
  return `<ul class="list-view">${items.map(row).join('')}</ul>`;
}

/**
 * Gallery card for a database item. `item.props` is HTML from the pill helpers.
 */
export function galleryCard(item) {
  const inner = `<span class="card-cover cover-${e(item.cover)}" aria-hidden="true"></span>${item.icon ? pageIcon(item.icon, item.cover, 'card') : ''}<span class="card-title">${e(item.title)}</span><span class="card-summary">${e(item.summary)}</span><span class="card-props">${item.props}</span>`;
  if (!item.href) return `<div class="card card-static">${inner}</div>`;
  const external = /^https:/.test(item.href);
  return `<a class="card" href="${e(item.href)}"${external ? ' rel="noopener"' : ''}>${inner}</a>`;
}

export function gallery(items) {
  assert.ok(items.length <= MAX_ITEMS, 'gallery: too many items');
  return `<ul class="gallery">${items.map((item) => `<li>${galleryCard(item)}</li>`).join('')}</ul>`;
}
