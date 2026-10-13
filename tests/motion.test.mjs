import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('homepage includes orbit, rocket pad, and motion that honors reduced-motion',async()=>{
 const home=await read('templates/home.html');
 const styles=await read('out/styles.css');
 const built=await read('out/index.html');
 assert.match(home,/class="orbit"/);
 assert.match(home,/class="rocket-pad"/);
 assert.match(built,/class="rocket-pad"/);
 assert.match(styles,/@keyframes orbit-spin/);
 assert.match(styles,/@keyframes rocket-station-keep/);
 assert.match(styles,/@keyframes rocket-exhaust/);
 assert.match(styles,/@keyframes rocket-launch/);
 assert.match(styles,/@keyframes telemetry-ping/);
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)[\s\S]*?animation:none/);
});
