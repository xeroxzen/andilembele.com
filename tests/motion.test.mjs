import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pointerRatio,countAt} from '../src/client/motion.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('all animation sits behind prefers-reduced-motion: no-preference',async()=>{
 const styles=await read('out/styles.css');
 const start=styles.indexOf('@media(prefers-reduced-motion:no-preference){\n @view-transition');
 assert.ok(start>0,'motion block is missing');
 const outside=styles.slice(0,start).replace(/@media\(prefers-reduced-motion:no-preference\)\{[\s\S]*?\n\}/g,'');
 assert.equal(/animation:[a-z]/.test(outside),false,'an animation runs outside the reduced-motion guard');
 for(const name of ['word-rise','ink-draw','pulse','menu-in','bob'])assert.match(styles,new RegExp('@keyframes '+name+'\\{'));
});

test('the hero draws its line art, moves data packets, and reads its headline once',async()=>{
 const home=await read('out/index.html');
 assert.match(home,/<svg class="art art-hero"[^>]*aria-hidden="true"/);
 assert.equal((home.match(/<animateMotion /g)||[]).length,3);
 assert.match(home,/<h1 class="display" id="hero-title" aria-label="I build secure, data-heavy systems — from 40B-record pipelines to AI tooling\."><span aria-hidden="true">/);
 assert.match(home,/<em class="headline-em">secure,<\/em>/);
 assert.match(home,/<dd data-count-to="40" data-suffix="B\+">40B\+<\/dd>/);
});

test('pointer ratios clamp to the box and count-up eases to its target',()=>{
 const rect={left:100,top:100,width:200,height:100};
 assert.deepEqual(pointerRatio(200,150,rect),{x:0,y:0});
 assert.deepEqual(pointerRatio(0,500,rect),{x:-1,y:1});
 assert.deepEqual(pointerRatio(10,10,{left:0,top:0,width:0,height:0}),{x:0,y:0});
 assert.equal(countAt(40,0),0);
 assert.equal(countAt(40,1),40);
 assert.equal(countAt(40,2),40);
 assert.ok(countAt(40,.5)>20,'ease-out passes the midpoint early');
});
