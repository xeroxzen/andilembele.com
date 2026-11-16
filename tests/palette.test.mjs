import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PALETTE, BUTTON, TOKEN_NAMES, CONTRAST_PAIRS, contrast } from '../lib/palette.mjs';

const styles = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const tokenBlock = (opener) => {
  const start = styles.indexOf(opener);
  assert.ok(start >= 0, 'missing token block ' + opener);
  return styles.slice(start, styles.indexOf('}', start));
};

test('CSS tokens match lib/palette.mjs in both themes', () => {
  const light = tokenBlock(':root{\n color-scheme:light;');
  const darks = [tokenBlock('@media screen and (prefers-color-scheme:dark)'), tokenBlock(':root[data-theme="dark"]{')];
  for (const name of TOKEN_NAMES) {
    assert.ok(light.includes(`--${name}:${PALETTE.light[name]};`), `light --${name}`);
    if (['success', 'warning', 'danger'].includes(name)) continue;
    for (const dark of darks) assert.ok(dark.includes(`--${name}:${PALETTE.dark[name]};`), `dark --${name}`);
  }
  assert.ok(light.includes(`--accent-button:${BUTTON.bg};`) && light.includes(`--on-accent:${BUTTON.ink};`));
});

test('no hex colour outside the token blocks', () => {
  const end = styles.indexOf('/* Base */');
  assert.ok(end > 0);
  assert.deepEqual(styles.slice(end).match(HEX), null);
  assert.doesNotMatch(styles.slice(end), /\b(white|black)\b(?!-)|rgba?\(/);
});

test('components and client code take colours from the palette', async () => {
  const dirs = ['../components/', '../src/client/'];
  for (const dir of dirs) {
    const files = (await readdir(new URL(dir, import.meta.url))).filter((f) => /\.(mjs|js)$/.test(f));
    for (const file of files) {
      const source = await readFile(new URL(dir + file, import.meta.url), 'utf8');
      assert.deepEqual(source.match(/['"`=]#[0-9a-fA-F]{6}\b/g), null, file);
    }
  }
});

test('every listed pair meets WCAG AA in both themes', () => {
  for (const theme of ['light', 'dark']) {
    for (const [fg, bg, min] of CONTRAST_PAIRS) {
      const ratio = contrast(PALETTE[theme][fg], PALETTE[theme][bg]);
      assert.ok(ratio >= min, `${theme} ${fg} on ${bg}: ${ratio.toFixed(2)} < ${min}`);
    }
  }
  assert.ok(contrast(BUTTON.ink, BUTTON.bg) >= 4.5);
  assert.ok(contrast(BUTTON.ink, BUTTON.hover) >= 4.5);
});
