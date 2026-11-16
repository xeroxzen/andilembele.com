import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {cardName,outputFile} from '../components/site.mjs';
import {indexMarkup,markupHash,postLink} from '../dist/blog/listing.js';

const out=new URL('../out/',import.meta.url);
const read=path=>readFile(new URL(path,out),'utf8');

async function htmlFiles(dir='',depth=0){
 assert.ok(depth<6,'output tree is unexpectedly deep');
 const files=[];
 for(const entry of await readdir(new URL(dir,out),{withFileTypes:true})){
  if(entry.isDirectory()&&entry.name!=='assets')files.push(...await htmlFiles(dir+entry.name+'/',depth+1));
  else if(entry.name.endsWith('.html'))files.push(dir+entry.name);
 }
 return files;
}

test('page paths map to files and share-card names',()=>{
 assert.equal(outputFile('/'),'index.html');
 assert.equal(outputFile('/projects/echofind/'),'projects/echofind/index.html');
 assert.equal(cardName('/projects/echofind/'),'projects-echofind');
 assert.throws(()=>outputFile('/../x/'));
});

test('every internal link and asset on every built page resolves to a file',async()=>{
 const pages=await htmlFiles();
 assert.ok(pages.length>=17);
 const missing=[];
 for(const page of pages){
  const html=await read(page);
  for(const [,url] of html.matchAll(/(?:href|src|srcset)="(\/[^"#?]*)/g)){
   if(url.startsWith('/blog/')&&url!=='/blog/'&&!/\.\w+$/.test(url))continue; // journal posts come from Firestore in production
   if(url.startsWith('/api/'))continue;
   const file=url.endsWith('/')?url.slice(1)+'index.html':url.slice(1);
   try{await access(new URL(file,out));}catch{missing.push(`${page} → ${url}`);}
  }
  assert.equal(/href="undefined"/.test(html),false,page+' links to "undefined"');
 }
 assert.deepEqual(missing,[]);
});

test('each page has its own title, description, canonical URL, and share card',async()=>{
 const titles=new Set();
 for(const page of ['projects/index.html','projects/ferrite/index.html','now/index.html','about/index.html','resume/index.html','contact/index.html']){
  const html=await read(page);
  const title=html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(!titles.has(title),'duplicate title '+title);
  titles.add(title);
  assert.match(html,/<meta name="description" content="[^"]{20,}">/,page);
  const path='/'+page.replace(/index\.html$/,'');
  assert.ok(html.includes(`<link rel="canonical" href="https://andilembele.com${path}">`)||/<link rel="canonical" href="https?:\/\/[^"]+">/.test(html),page);
  const image=html.match(/<meta property="og:image" content="[^"]+(\/assets\/og\/[a-z-]+\.jpg)">/)[1];
  const card=await readFile(new URL(image.slice(1),out));
  assert.ok(card.length>1000&&card.length<=300_000,image);
 }
 const about=await read('about/index.html');
 assert.equal(JSON.parse(about.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1])['@type'],'Person');
});

test('the sitemap lists every static page and the 404 is kept out of search',async()=>{
 const sitemap=await read('sitemap.xml');
 for(const path of ['/','/projects/','/projects/tracegraph/','/now/','/about/','/resume/','/contact/','/blog/'])assert.ok(sitemap.includes(`${path}</loc>`),path);
 assert.ok(!sitemap.includes('404'));
 assert.match(await read('404.html'),/<meta name="robots" content="noindex">/);
});

test('the blog index is prerendered and admin routes show the workspace placeholder',async()=>{
 const blog=await read('blog/index.html');
 assert.match(blog,/<section id="latest" aria-label="Latest article"><p class="small-heading">Latest<\/p><article class="featured-post">/);
 for(const route of ['admin','admin/posts','blog/admin']){
  const html=await read(route+'/index.html');
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/,route);
  assert.doesNotMatch(html,/data-rendered/,route);
  assert.match(html,/<main id="app"[^>]*><section class="blog-head"><h1>Admin\.<\/h1><p>Loading workspace…<\/p><\/section><\/main>/,route);
 }
});

test('the blog index carries the hash of the list the client would render, so it skips an identical redraw',async()=>{
 const blog=await read('blog/index.html');
 const medium=JSON.parse(await read('blog/medium-posts.json'));
 // Deploys snapshot the published journal posts before building; local and pull-request builds have none.
 let journal=[];
 try{journal=JSON.parse(await readFile(new URL('../dist/blog/journal-posts.json',import.meta.url),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 const posts=[...journal,...medium],slugs=journal.map(p=>p.slug);
 const stamp=blog.match(/<main id="app" data-rendered="([0-9a-f]{8})"/)[1];
 assert.equal(stamp,markupHash(indexMarkup(posts,slugs)));
 assert.equal(markupHash(indexMarkup([...medium].reverse())),markupHash(indexMarkup(medium)),'order of the fetched posts does not matter');
 assert.notEqual(markupHash(indexMarkup(posts.slice(1),slugs)),stamp);
 assert.equal(markupHash(''),'811c9dc5');
});

test('journal posts link to their prerendered page when the build passes its slugs',()=>{
 const post={slug:'rumi',source:'Journal',title:'Rumi',date:'2026-11-09',tags:[],excerpt:'x'};
 assert.equal(postLink(post,['rumi']),'/blog/rumi/');
 assert.equal(postLink(post,[]),'/blog/?post=rumi');
 assert.match(indexMarkup([post],['rumi']),/<a href="\/blog\/rumi\/">Rumi/);
});
