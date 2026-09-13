import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('public pages and controls follow the operating-system color scheme',async()=>{
 const styles=await read('out/styles.css');
 const blogStyles=await read('out/blog/blog.css');
 assert.match(styles,/color-scheme:light dark/);
 assert.match(styles,/@media\(prefers-color-scheme:dark\)/);
 assert.match(blogStyles,/@media\(prefers-color-scheme:dark\)/);

 for(const page of ['out/index.html','out/blog/index.html','out/admin/index.html','out/404.html']){
  const html=await read(page);
  assert.match(html,/<meta name="color-scheme" content="light dark">/,page);
  assert.match(html,/<meta name="theme-color" content="#fcfefc" media="\(prefers-color-scheme: light\)">/,page);
  assert.match(html,/<meta name="theme-color" content="#0d120e" media="\(prefers-color-scheme: dark\)">/,page);
 }
});
