import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('home follows the brief: hero, proof, roles, featured work, principles, writing',async()=>{
 const home=await read('out/index.html');
 const order=['class="hero"','class="proof"','id="open-to"','id="work"','id="principles"','id="writing"','<footer>'];
 let last=-1;
 for(const marker of order){
  const at=home.indexOf(marker);
  assert.ok(at>last,`${marker} is missing or out of order`);
  last=at;
 }
 assert.match(home,/<a class="button button-primary" href="\/projects\/">View work<\/a><a class="button" href="\/contact\/">Get in touch<\/a>/);
 assert.equal((home.match(/class="role-card"/g)||[]).length,6);
 for(const role of ['Software Engineer','Data Engineer','DevOps Engineer','Threat Intelligence Analyst'])assert.ok(home.includes(`<h3>${role}</h3>`),role);
 assert.match(home,/<dt>projects and releases in \d{4}<\/dt><dd data-count-to="\d+" data-suffix="">/);
 assert.equal((home.match(/<p class="principle-source">From <cite>/g)||[]).length,3);
 assert.equal((home.match(/<a class="card" href="\/projects\/[a-z-]+\/">/g)||[]).length,4);
 assert.equal((home.match(/class="principle"/g)||[]).length,3);
 assert.match(home,/Open to software, data, DevOps and security roles/);
 assert.match(home,/<kbd data-mod-key>⌘<\/kbd><kbd>K<\/kbd>/);
});

test('every page links scripts and stylesheets by a hash of their contents',async()=>{
 const out=new URL('../out/',import.meta.url);
 const hash=async path=>createHash('sha256').update(await readFile(new URL(path,out))).digest('hex').slice(0,10);
 for(const page of ['index.html','projects/index.html','projects/echofind/index.html','resume/index.html','blog/index.html','admin/index.html','404.html']){
  const html=await readFile(new URL(page,out),'utf8');
  const refs=[...html.matchAll(/(?:src|href)="\/?([\w/-]+\.(?:js|css))(\?v=[^"]*)?"/g)];
  assert.ok(refs.length>=3,page);
  for(const [,path,query] of refs)assert.equal(query,'?v='+await hash(path),`${page} links ${path} without its current hash`);
 }
});

test('pages carry no inline styles or scripts the CSP would block',async()=>{
 for(const page of ['index.html','projects/index.html','projects/tracegraph/index.html','about/index.html','now/index.html','resume/index.html','contact/index.html','blog/index.html','404.html']){
  const html=await read('out/'+page);
  assert.equal(/\sstyle="/.test(html),false,page+' has a style attribute');
  assert.equal(/<style[\s>]/.test(html),false,page+' has a <style> element');
  const inline=[...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].filter(([,attrs])=>!/type="application\/ld\+json"/.test(attrs));
  assert.equal(inline.length,0,page+' has an inline script');
  assert.equal(/\son[a-z]+="/.test(html),false,page+' has an inline event handler');
 }
});
