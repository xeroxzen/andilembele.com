import { escapeHTML as e, markdown } from '../dist/blog/markdown.js';
import { STATUSES } from '../lib/content.mjs';
import { PALETTE, BUTTON, TOKEN_NAMES, CONTRAST_PAIRS, contrast } from '../lib/palette.mjs';
import { block, sectionHeading, callout, pill, statusPill, tagPills, pageHeader } from './blocks.mjs';

// /design: the style guide. Unlisted and noindex; the nav toggle switches it between themes.

const SAMPLE_CODE = '```ts\n// Retry with jitter, bounded.\nexport async function retry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {\n  for (let i = 1; i <= attempts; i += 1) {\n    try { return await run(); } catch (error) { if (i === attempts) throw error; }\n    await sleep(2 ** i * 100 + Math.random() * 50);\n  }\n  throw new Error("unreachable");\n}\n```';

function tokens() {
  const row = (name) => `<tr><td><span class="swatch swatch-${name}" aria-hidden="true"></span><code>--${name}</code></td><td><code>${PALETTE.light[name]}</code></td><td><code>${PALETTE.dark[name]}</code></td></tr>`;
  return `<table class="design-table"><thead><tr><th>Token</th><th>Light</th><th>Dark</th></tr></thead><tbody>${TOKEN_NAMES.map(row).join('')}</tbody></table>`;
}

function buttons() {
  const states = [['Default', ''], ['Hover', ' is-hover'], ['Focus', ' is-focus']];
  const row = (cls, label) => `<div class="design-row">${states.map(([state, s]) => `<span class="button${cls}${s}">${label} · ${state}</span>`).join('')}</div>`;
  return row(' button-primary', 'Primary') + row('', 'Secondary') + `<p class="design-note">Primary is <code>${BUTTON.bg}</code> with white text in both themes and presses to <code>${BUTTON.hover}</code>. Inline links use <a href="/design/">the link token</a>.</p>`;
}

function contrastReport() {
  const ratio = (fg, bg, theme) => contrast(PALETTE[theme][fg], PALETTE[theme][bg]);
  const cell = (r, min) => `<td class="${r >= min ? '' : 'design-fail'}">${r.toFixed(2)}</td>`;
  const rows = CONTRAST_PAIRS.map(([fg, bg, min]) => `<tr><td>${e(fg)} on ${e(bg)}</td><td>${min}</td>${cell(ratio(fg, bg, 'light'), min)}${cell(ratio(fg, bg, 'dark'), min)}</tr>`);
  const button = contrast(BUTTON.ink, BUTTON.bg);
  rows.push(`<tr><td>white on button</td><td>4.5</td>${cell(button, 4.5)}${cell(button, 4.5)}</tr>`);
  return `<table class="design-table"><thead><tr><th>Pair</th><th>Min</th><th>Light</th><th>Dark</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

export function designPage() {
  const sections = [
    ['Headline', '<p class="display design-display">Secure systems, built to <em class="headline-em">last.</em></p><p class="design-note">Newsreader italic, one word per major headline, never in body copy.</p>'],
    ['Tokens', tokens()],
    ['Buttons', buttons()],
    ['Pills', `<div class="design-row">${STATUSES.map(statusPill).join('')}${pill('Security')}${tagPills(['Rust', 'Go'])}</div>`],
    ['Callouts', ['note', 'tip', 'important', 'warning', 'caution'].map((tone) => callout({ title: tone[0].toUpperCase() + tone.slice(1), body: '<p>Callouts sit on the surface token with a semantic rule.</p>', tone })).join('')],
    ['Code', `<div class="prose">${markdown(SAMPLE_CODE)}<p>Inline <code>const ok = true</code> in a sentence.</p></div>`],
    ['Contrast', contrastReport()],
  ];
  const main = pageHeader({ title: 'Design', lead: 'Charcoal, Sand, and Electric Blue. Use the theme switch in the header to see the other mode.' })
    + sections.map(([title, inner]) => block(sectionHeading(title) + inner, { reveal: false })).join('');
  return { path: '/design/', title: 'Design · Andile Jaden Mbele', description: 'Style guide.', current: '', main, mainClass: 'page-wide', card: null, noindex: true };
}
