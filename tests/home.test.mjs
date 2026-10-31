import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('homepage intro, projects, talks, tools, and contact follow the editorial layout',async()=>{
 const home=await read('templates/home.html');
 const page=await read('out/index.html');
 const styles=await read('out/styles.css');

 assert.match(home,/class="metrics"/);
 assert.equal(home.includes('Systems Engineer.'),false);
 assert.equal(home.includes('Say hello.'),false);
 assert.match(home,/For platforms, talks, or collaboration/);
 assert.match(home,/class="project-more"/);
 assert.match(home,/class="talk-gallery"/);
 assert.equal((home.match(/class="talk-card/g)||[]).length,3);
 assert.match(home,/\/assets\/icons\/go\.svg/);
 assert.match(home,/<span>Go<\/span>/);
 assert.match(page,/class="metrics"/);
 assert.match(page,/project-more/);

 assert.match(home,/\/assets\/icons\/neovim\.svg/);
 assert.equal(styles.includes('.tool-list img{display:none}'),false);
 assert.match(styles,/\.talk-gallery\{grid-template-columns:repeat\(3/);
 assert.match(styles,/\.talk-card h3,\.notes h3 a\{color:var\(--ink\)/);
 assert.match(styles,/\.notes article a:hover/);
 assert.match(styles,/\.experience-list \.date\{white-space:nowrap/);
 assert.match(styles,/\.topbar nav\{flex-wrap:nowrap/);
});
test('home stylesheet URL carries a hash of the stylesheet so immutable caches refresh',async()=>{
 const {createHash}=await import('node:crypto');
 const version=createHash('sha256').update(await readFile(new URL('../out/styles.css',import.meta.url))).digest('hex').slice(0,10);
 const home=await readFile(new URL('../out/index.html',import.meta.url),'utf8');
 assert.ok(home.includes(`href="/styles.css?v=${version}"`));
});
