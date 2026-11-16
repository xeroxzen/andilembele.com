import assert from 'node:assert/strict';

// Original line art, drawn in "ink" (currentColor) so it follows the theme. Every path uses pathLength="1",
// so CSS can draw it in with one dash rule. SMIL <animateMotion> moves the data packets; /site.js pauses
// it for reduced motion. Replace any entry with final hand-drawn art by swapping its SVG body.

const ink = (d, { id = '', cls = '' } = {}) => `<path class="ink${cls ? ' ' + cls : ''}" pathLength="1" d="${d}"${id ? ` id="${id}"` : ''}/>`;
const dot = (cx, cy, r, cls = 'ink-fill') => `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${r}"/>`;
const note = (x, y, text) => `<text class="ink-note" x="${x}" y="${y}">${text}</text>`;

function packet(path, dur, begin) {
  return `<circle class="packet" r="4.5" opacity="0"><set attributeName="opacity" to="1" begin="${begin}" fill="freeze"/><animateMotion dur="${dur}" begin="${begin}" repeatCount="indefinite" rotate="auto"><mpath href="#${path}"/></animateMotion></circle>`;
}

// Records flow from storage, through a filter, past a verification shield, and into a small model graph.
const hero = `<svg class="art art-hero" viewBox="0 0 480 400" width="480" height="400" aria-hidden="true" focusable="false">
<g class="depth depth-1">
${ink('M30 236 h40 l12 12 v52 h-52 Z')}${ink('M70 236 v12 h12')}${ink('M40 262 h28 M40 274 h32 M40 286 h22')}
${ink('M56 226 V188')}${ink('M49 196 L56 186 L63 196')}
${note(18, 330, '40B records')}
</g>
<g class="depth depth-2">
${ink('M36 92 C36 84 124 84 124 92 C124 100 36 100 36 92 Z')}${ink('M36 92 V170 M124 92 V170')}${ink('M36 118 C36 127 124 127 124 118')}${ink('M36 144 C36 153 124 153 124 144')}${ink('M36 170 C36 179 124 179 124 170')}
</g>
${ink('M124 132 C168 132 168 200 210 200', { id: 'hero-pipe-1' })}
<g class="depth depth-3">
${ink('M210 160 L270 184 L270 216 L210 240 Z')}${ink('M228 168 V232 M246 176 V224')}
${note(196, 270, 'filter')}
</g>
${ink('M270 200 C306 200 318 190 344 190', { id: 'hero-pipe-2' })}
<g class="depth depth-2">
${ink('M400 128 C424 140 444 144 456 144 C456 200 440 238 400 258 C360 238 344 200 344 144 C356 144 376 140 400 128 Z')}
${ink('M378 192 L394 208 L424 176', { cls: 'ink-accent' })}
${note(372, 110, 'verify')}
</g>
${ink('M400 258 C400 292 362 300 330 322', { id: 'hero-pipe-3' })}
<g class="depth depth-3 graph">
${ink('M330 322 L276 348 M330 322 L322 374 M330 322 L386 356 M276 348 L322 374 M322 374 L386 356')}
${dot(330, 322, 7)}${dot(276, 348, 5)}${dot(322, 374, 5)}${dot(386, 356, 5)}
${ink('M420 306 v16 M412 314 h16', { cls: 'spark' })}
${note(410, 392, 'AI')}
</g>
${packet('hero-pipe-1', '3.4s', '1.6s')}${packet('hero-pipe-2', '2.6s', '2.2s')}${packet('hero-pipe-3', '3s', '2.8s')}
</svg>`;

// A small stack of project cards and a pointer.
const projects = `<svg class="art art-small" viewBox="0 0 160 120" width="160" height="120" aria-hidden="true" focusable="false">
${ink('M44 24 h76 a6 6 0 0 1 6 6 v44 a6 6 0 0 1 -6 6 h-76 a6 6 0 0 1 -6 -6 v-44 a6 6 0 0 1 6 -6 Z')}
${ink('M34 34 h76 a6 6 0 0 1 6 6 v44 a6 6 0 0 1 -6 6 h-76 a6 6 0 0 1 -6 -6 v-44 a6 6 0 0 1 6 -6 Z')}
${ink('M24 44 h76 a6 6 0 0 1 6 6 v44 a6 6 0 0 1 -6 6 h-76 a6 6 0 0 1 -6 -6 v-44 a6 6 0 0 1 6 -6 Z')}
${ink('M18 60 h88')}${ink('M30 72 h40 M30 82 h52 M30 92 h28')}
<g class="bob">${ink('M114 78 L136 100 L126 101 L132 113 L127 115 L121 103 L114 109 Z')}</g>
</svg>`;

// A clock whose minute hand keeps moving.
const now = `<svg class="art art-small" viewBox="0 0 160 120" width="160" height="120" aria-hidden="true" focusable="false">
${ink('M80 14 C112 14 132 36 132 62 C132 90 110 108 80 108 C50 108 28 88 28 62 C28 34 50 14 80 14 Z')}
${ink('M80 22 v8 M80 94 v8 M36 62 h8 M116 62 h8')}
${ink('M80 62 L62 50')}
<g class="spin">${ink('M80 62 L80 32', { cls: 'ink-accent' })}</g>
${dot(80, 62, 3.5)}
${ink('M120 18 l8 -6 M132 30 l10 -2')}
</svg>`;

// An open book with a small rocket lifting off it.
const about = `<svg class="art art-small" viewBox="0 0 160 120" width="160" height="120" aria-hidden="true" focusable="false">
${ink('M80 100 C64 92 40 90 18 94 V54 C40 50 64 52 80 60 C96 52 120 50 142 54 V94 C120 90 96 92 80 100 Z')}
${ink('M80 60 V100')}${ink('M30 66 c14 -2 28 0 40 4 M30 78 c14 -2 28 0 40 4 M92 70 c12 -4 26 -6 40 -4 M92 82 c12 -4 26 -6 40 -4')}
<g class="bob">${ink('M80 10 C88 18 90 30 88 42 H72 C70 30 72 18 80 10 Z')}${ink('M72 36 L64 46 L72 44 M88 36 L96 46 L88 44')}${dot(80, 26, 3, 'ink-hollow')}${ink('M76 46 L80 54 L84 46', { cls: 'ink-accent' })}</g>
</svg>`;

// A paper plane with a dashed trail.
const contact = `<svg class="art art-small" viewBox="0 0 160 120" width="160" height="120" aria-hidden="true" focusable="false">
${ink('M12 96 C40 92 50 70 74 70 C92 70 96 84 84 88', { cls: 'trail' })}
<g class="bob">${ink('M92 56 L148 24 L118 84 L106 66 Z')}${ink('M148 24 L106 66 L104 82 L114 72')}</g>
</svg>`;

const ART = { hero, projects, now, about, contact };

/**
 * Inline SVG for a named illustration. Inline, so the ink inherits the text colour in both themes.
 */
export function art(name) {
  assert.ok(Object.hasOwn(ART, name), 'art: unknown illustration ' + name);
  return ART[name].replace(/\n/g, '');
}
