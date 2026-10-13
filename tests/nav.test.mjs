import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {sectionIdFromHref,sectionTargets,activeSectionId,applyCurrent} from '../dist/nav.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

function fakeLink(href,current=null){
 const attributes={href};
 if(current)attributes['aria-current']=current;
 return{
  getAttribute(name){return Object.hasOwn(attributes,name)?attributes[name]:null;},
  setAttribute(name,value){attributes[name]=value;},
  removeAttribute(name){delete attributes[name];},
 };
}

test('section ids come from in-page hashes and ignore other routes',()=>{
 assert.equal(sectionIdFromHref('#work'),'work');
 assert.equal(sectionIdFromHref('/#contact'),'contact');
 assert.equal(sectionIdFromHref('/blog'),null);
 assert.equal(sectionIdFromHref('#'),null);
 assert.equal(sectionIdFromHref(null),null);
});

test('section targets skip links that have no matching element on the page',()=>{
 const experience=fakeLink('#experience');
 const writing=fakeLink('/blog');
 const missing=fakeLink('#missing');
 const nav={querySelectorAll(){return [experience,writing,missing];}};
 const root={getElementById(id){return id==='experience'?{id}:null;}};
 const targets=sectionTargets(nav,root);
 assert.equal(targets.length,1);
 assert.equal(targets[0].id,'experience');
 assert.equal(targets[0].link,experience);
});

test('active section follows the reading marker and the page bottom',()=>{
 const positions=[{id:'experience',top:40},{id:'work',top:300},{id:'contact',top:900}];
 const viewport={height:800,markerY:160,scrollY:0,documentHeight:4000};
 assert.equal(activeSectionId(positions,viewport),'experience');
 assert.equal(activeSectionId([{id:'experience',top:200},{id:'work',top:500}],viewport),null);
 assert.equal(activeSectionId(positions,{...viewport,scrollY:3200,documentHeight:4000}),'contact');
});

test('applyCurrent highlights one hash link and leaves page-level current alone',()=>{
 const experience=fakeLink('#experience');
 const writing=fakeLink('/blog','page');
 const contact=fakeLink('#contact','true');
 applyCurrent([{link:experience,id:'experience'},{link:writing,id:'writing'},{link:contact,id:'contact'}],'experience');
 assert.equal(experience.getAttribute('aria-current'),'true');
 assert.equal(writing.getAttribute('aria-current'),'page');
 assert.equal(contact.getAttribute('aria-current'),null);
});

test('templates and built pages use dynamic current instead of a Contact-only pill',async()=>{
 for(const page of ['templates/home.html','templates/blog.html','dist/index.html','dist/blog/index.html','out/index.html','out/blog/index.html']){
  const html=await read(page);
  assert.equal(html.includes('nav-contact'),false,page+' still hardcodes Contact');
  assert.match(html,/src="\/nav\.js"/,page+' must load the section nav script');
 }
 const home=await read('templates/home.html');
 const blog=await read('templates/blog.html');
 assert.equal(home.includes('class="nav-contact"'),false);
 assert.match(blog,/href="\/blog" aria-current="page"/);
 const styles=await read('dist/styles.css');
 assert.match(styles,/\.topbar nav a\[aria-current\]/);
 assert.equal(styles.includes('.nav-contact'),false);
 await access(new URL('../out/nav.js',import.meta.url));
});
