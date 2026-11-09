import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';

const BASE = new URL('../dist/assets/andile-opengraph.png', import.meta.url);
const FONTS = ['Medium', 'SemiBold', 'Bold'].map((weight) => fileURLToPath(new URL(`../scripts/fonts/Inter-${weight}.ttf`, import.meta.url)));
const CARD = { width: 1730, height: 909 };
export const ARTICLE_IMAGE = { width: 1200, height: 631 };
const INK = '#0b0d10', ACCENT = '#0d3d2a', PAPER = '#fdfdfb';
const LEFT = 94, TEXT_WIDTH = 860, BOLD_CHAR_EM = 0.58, MAX_LINES = 4;
const SIZES = [96, 80, 68, 58];
// Link previewers such as WhatsApp drop images much over 300 KB; a 1200px PNG of the portrait card is about 650 KB.
const JPEG_QUALITY = 84;
const MAX_CARD_BYTES = 300_000;

const escapeXML = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/**
 * Greedy word wrap using an average Inter Bold glyph width. A word wider than a line keeps its own line.
 */
export function wrapTitle(title, size) {
  const limit = Math.floor(TEXT_WIDTH / (size * BOLD_CHAR_EM));
  const lines = [];
  for (const word of title.trim().split(/\s+/)) {
    const last = lines.at(-1);
    if (last !== undefined && (last + ' ' + word).length <= limit) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  return lines;
}

/**
 * Largest size whose wrapped title fits; the longest titles are cut at MAX_LINES with an ellipsis.
 */
export function fitTitle(title) {
  for (const size of SIZES) {
    const lines = wrapTitle(title, size);
    if (lines.length <= MAX_LINES) return { size, lines };
  }
  const size = SIZES.at(-1);
  const lines = wrapTitle(title, size).slice(0, MAX_LINES);
  lines[MAX_LINES - 1] += '…';
  return { size, lines };
}

function render(base, overlay, fitTo) {
  const href = 'data:image/png;base64,' + base.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CARD.width}" height="${CARD.height}"><image xlink:href="${href}" width="${CARD.width}" height="${CARD.height}"/>${overlay}</svg>`;
  return new Resvg(svg, { fitTo, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Inter' } }).render();
}

function toJpeg(image) {
  const { data } = jpeg.encode({ data: image.pixels, width: image.width, height: image.height }, JPEG_QUALITY);
  assert.ok(data.length <= MAX_CARD_BYTES, `Share card is ${data.length} bytes, over the ${MAX_CARD_BYTES}-byte preview limit`);
  return data;
}

const eyebrow = (text, y) => `<text x="${LEFT}" y="${y}" font-family="Inter" font-weight="600" font-size="28" letter-spacing="5" fill="${ACCENT}">${escapeXML(text.toUpperCase())}</text>`;

/**
 * Repaints the role and focus lines of the shared card, leaving the name and portrait untouched.
 */
export async function renderSiteCard({ role, focus }) {
  const overlay = `<rect x="80" y="215" width="880" height="55" fill="${PAPER}"/><rect x="80" y="590" width="890" height="65" fill="${PAPER}"/>${eyebrow(role, 252)}<text x="${LEFT}" y="636" font-family="Inter" font-weight="500" font-size="38" fill="${INK}">${escapeXML(focus)}</text>`;
  return render(await readFile(BASE), overlay, { mode: 'original' }).asPng();
}

/**
 * The shared card at preview size, encoded as JPEG for link previews.
 */
export async function renderSiteCardJpeg() {
  return toJpeg(render(await readFile(BASE), '', { mode: 'width', value: ARTICLE_IMAGE.width }));
}

/**
 * Article card: the shared card's portrait and marks, with the article title in place of the name, as JPEG.
 */
export async function renderArticleCard({ title, label }) {
  assert.ok(title.trim(), 'renderArticleCard: title is required');
  const { size, lines } = fitTitle(title);
  const lineHeight = Math.round(size * 1.12);
  const top = Math.round(454 - (lines.length * lineHeight) / 2 + size * 0.45);
  const tspans = lines.map((line, i) => `<tspan x="${LEFT}" y="${top + i * lineHeight}">${escapeXML(line)}</tspan>`).join('');
  const overlay = `<rect x="60" y="200" width="925" height="480" fill="${PAPER}"/>${eyebrow(label, top - size - 22)}<text font-family="Inter" font-weight="700" font-size="${size}" letter-spacing="-2" fill="${INK}">${tspans}</text>`;
  return toJpeg(render(await readFile(BASE), overlay, { mode: 'width', value: ARTICLE_IMAGE.width }));
}
