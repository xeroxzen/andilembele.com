import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {effectiveTheme,toggledTheme} from '../src/client/theme.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const PAGES=['out/index.html','out/projects/index.html','out/about/index.html','out/blog/index.html','out/admin/index.html','out/404.html'];

test('pages follow the system theme, allow a saved override, and apply it before first paint',async()=>{
 const styles=await read('out/styles.css');
 assert.match(styles,/@media screen and \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{/);
 assert.match(styles,/:root\[data-theme="dark"\]\{/);
 assert.match(styles,/--bg:#1e1e1c;--surface:#272725;--surface-strong:#32322e/);
 assert.match(styles,/--bg:#f4efe6;--surface:#ebe3d5;--surface-strong:#d8cbb3/);
 for(const page of PAGES){
  const html=await read(page);
  assert.match(html,/<meta name="color-scheme" content="light dark">/,page);
  assert.match(html,/<meta name="theme-color" content="#f4efe6" media="\(prefers-color-scheme: light\)">/,page);
  assert.match(html,/<meta name="theme-color" content="#1e1e1c" media="\(prefers-color-scheme: dark\)">/,page);
  // A classic, blocking script in <head>, so a saved dark theme never flashes light.
  assert.match(html,/<head>[\s\S]*<script src="\/theme-init\.js\?v=[0-9a-f]{10}"><\/script>[\s\S]*<\/head>/,page);
 }
});

test('theme toggling flips the theme the reader actually sees',()=>{
 assert.equal(effectiveTheme(null,true),'dark');
 assert.equal(effectiveTheme('light',true),'light');
 assert.equal(toggledTheme(null,false),'dark');
 assert.equal(toggledTheme(null,true),'light');
 assert.equal(toggledTheme('dark',false),'light');
});
