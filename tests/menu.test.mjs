import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {matches,step,shortcutFor} from '../src/client/menu.js';

test('menu search matches every word in any order, ignoring case',()=>{
 assert.equal(matches('EchoFind AI Next.js Whisper','whisper echo'),true);
 assert.equal(matches('EchoFind','rust'),false);
 assert.equal(matches('Anything','  '),true);
});

test('arrow keys wrap around the visible options',()=>{
 assert.equal(step(-1,3,1),0);
 assert.equal(step(-1,3,-1),2);
 assert.equal(step(2,3,1),0);
 assert.equal(step(0,3,-1),2);
 assert.equal(step(0,0,1),-1);
});

test('⌘K or Ctrl+K opens the palette; "/" opens quick jump except while typing',()=>{
 const body={tagName:'BODY'};
 assert.equal(shortcutFor({key:'k',metaKey:true,target:body}),'palette');
 assert.equal(shortcutFor({key:'K',ctrlKey:true,target:body}),'palette');
 assert.equal(shortcutFor({key:'k',target:body}),null);
 assert.equal(shortcutFor({key:'/',target:body}),'slash');
 assert.equal(shortcutFor({key:'/',target:{tagName:'INPUT'}}),null);
 assert.equal(shortcutFor({key:'/',target:{tagName:'DIV',isContentEditable:true}}),null);
});

test('every page ships both menus with labelled, unique options',async()=>{
 const html=await readFile(new URL('../out/projects/index.html',import.meta.url),'utf8');
 assert.match(html,/<dialog class="menu menu-palette" id="palette" aria-label="Command menu">/);
 assert.match(html,/<dialog class="menu menu-slash" id="slash" aria-label="Quick jump">/);
 for(const command of ['/projects','/resume','/contact'])assert.ok(html.includes(`<span class="menu-label">${command}</span>`));
 for(const label of ['Copy email address','Toggle dark mode','Open GitHub','Open X'])assert.ok(html.includes(`<span class="menu-label">${label}</span>`),label);
 const ids=[...html.matchAll(/role="option" id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
});
