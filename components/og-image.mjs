import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';
import { PALETTE } from '../lib/palette.mjs';

// Share cards in the site's palette: sand background, charcoal type, one blue mark, and a block handle.
const FONTS = ['Medium', 'SemiBold', 'Bold'].map((weight) => fileURLToPath(new URL(`../scripts/fonts/Inter-${weight}.ttf`, import.meta.url)));
const PORTRAIT = new URL('../dist/assets/andile-mbele.jpg', import.meta.url);
export const ARTICLE_IMAGE = { width: 1200, height: 631 };
const { width: W, height: H } = ARTICLE_IMAGE;
const { bg: PAPER, text: INK, 'text-muted': MUTED, border: LINE, 'surface-strong': HANDLE, accent: ACCENT } = PALETTE.light;
const LEFT = 88, TEXT_WIDTH = 940, BOLD_CHAR_EM = 0.56, MAX_LINES = 4, TITLE_HEIGHT = 330;
const SIZES = [96, 80, 68, 58];
// Link previewers such as WhatsApp drop images much over 300 KB.
const JPEG_QUALITY = 86;
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

const linesThatFit = (size) => Math.min(MAX_LINES, Math.floor(TITLE_HEIGHT / (size * 1.08)));

/**
 * Largest size whose wrapped title fits the title area; the longest titles are cut with an ellipsis.
 */
export function fitTitle(title) {
  for (const size of SIZES) {
    const lines = wrapTitle(title, size);
    if (lines.length <= linesThatFit(size)) return { size, lines };
  }
  const size = SIZES.at(-1);
  const max = linesThatFit(size);
  const lines = wrapTitle(title, size).slice(0, max);
  lines[max - 1] += '…';
  return { size, lines };
}

// Six dots, like the drag handle on the site's blocks.
function handle(x, y) {
  let dots = '';
  for (let row = 0; row < 3; row += 1) for (let col = 0; col < 2; col += 1) dots += `<circle cx="${x + col * 12}" cy="${y + row * 12}" r="3.2" fill="${HANDLE}"/>`;
  return dots;
}

function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${PAPER}"/><rect x="24.5" y="24.5" width="${W - 49}" height="${H - 49}" rx="14" fill="none" stroke="${LINE}"/>${handle(48, 66)}<rect x="${LEFT}" y="60" width="34" height="34" rx="7" fill="${INK}"/><text x="${LEFT + 17}" y="84" text-anchor="middle" font-family="Inter" font-weight="700" font-size="19" fill="${PAPER}">A</text><text x="${LEFT + 48}" y="84" font-family="Inter" font-weight="600" font-size="24" fill="${INK}">Andile Jaden Mbele</text>${inner}<text x="${LEFT}" y="${H - 64}" font-family="Inter" font-weight="500" font-size="24" fill="${MUTED}">andilembele.com</text><rect x="${W - 88 - 60}" y="${H - 72}" width="60" height="6" rx="3" fill="${ACCENT}"/></svg>`;
}

function toJpeg(svg) {
  const image = new Resvg(svg, { fitTo: { mode: 'original' }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Inter' } }).render();
  const { data } = jpeg.encode({ data: image.pixels, width: image.width, height: image.height }, JPEG_QUALITY);
  assert.ok(data.length <= MAX_CARD_BYTES, `Share card is ${data.length} bytes, over the ${MAX_CARD_BYTES}-byte preview limit`);
  return data;
}

/**
 * Page or article card: a small label above the title, as JPEG.
 */
export async function renderArticleCard({ title, label }) {
  assert.ok(title.trim(), 'renderArticleCard: title is required');
  const { size, lines } = fitTitle(title);
  const lineHeight = Math.round(size * 1.08);
  const top = Math.round(340 - ((lines.length - 1) * lineHeight) / 2 + size * 0.35);
  const tspans = lines.map((line, i) => `<tspan x="${LEFT}" y="${top + i * lineHeight}">${escapeXML(line)}</tspan>`).join('');
  const eyebrow = `<text x="${LEFT}" y="${top - size - 10}" font-family="Inter" font-weight="600" font-size="24" letter-spacing="1" fill="${MUTED}">${escapeXML(label)}</text>`;
  return toJpeg(frame(`${eyebrow}<text font-family="Inter" font-weight="700" font-size="${size}" letter-spacing="${-size * 0.03}" fill="${INK}">${tspans}</text>`));
}

/**
 * The site card used by the homepage and anything without its own: portrait, name, and positioning.
 */
export async function renderSiteCardJpeg({ positioning }) {
  assert.ok(positioning.trim(), 'renderSiteCardJpeg: positioning is required');
  const portrait = 'data:image/jpeg;base64,' + (await readFile(PORTRAIT)).toString('base64');
  const { lines } = { lines: wrapTitle(positioning, 58).slice(0, 4) };
  const tspans = lines.map((line, i) => `<tspan x="${LEFT}" y="${250 + i * 66}">${escapeXML(line)}</tspan>`).join('');
  const photo = `<defs><clipPath id="p"><circle cx="1010" cy="200" r="86"/></clipPath></defs><image xlink:href="${portrait}" x="924" y="114" width="172" height="172" preserveAspectRatio="xMidYMid slice" clip-path="url(#p)"/><circle cx="1010" cy="200" r="86" fill="none" stroke="${LINE}" stroke-width="2"/>`;
  return toJpeg(frame(`${photo}<text font-family="Inter" font-weight="700" font-size="58" letter-spacing="-1.8" fill="${INK}">${tspans}</text>`));
}

/**
 * The favicon: a sand tile, a charcoal "a", and a blue full stop.
 */
export function renderFavicon() {
  const { bg, text, accent, border } = PALETTE.light;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="1" y="1" width="62" height="62" rx="14" fill="${bg}" stroke="${border}" stroke-width="2"/><text x="11" y="45" font-family="Inter,Arial,Helvetica,sans-serif" font-size="40" font-weight="700" fill="${text}">a</text><circle cx="46" cy="41" r="5" fill="${accent}"/></svg>\n`;
}
