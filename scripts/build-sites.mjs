import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {build} from 'esbuild';
import {renderPostPage} from '../components/post-page.mjs';
import {renderArticleCard,renderSiteCardJpeg} from '../components/og-image.mjs';
import {renderBlogShell} from '../components/layout.mjs';
import {buildPages} from '../components/site.mjs';
import {renderRobots,renderSitemap,renderFeed} from '../components/crawl-files.mjs';
import {dateLabel,indexMarkup,markupHash} from '../dist/blog/listing.js';
import {fileURLToPath} from 'node:url';
import {esbuildDefines, firebaseConfig, loadEnv, requireEnv} from '../lib/env.mjs';
loadEnv();
firebaseConfig();
const root=new URL('../',import.meta.url);
const origin=requireEnv('SITE_URL').replace(/\/$/,'');
const source=new URL('dist/',root),out=new URL('out/',root);
await rm(out,{recursive:true,force:true});
await mkdir(new URL('blog/',out),{recursive:true});
await cp(new URL('assets/',source),new URL('assets/',out),{recursive:true});
await cp(new URL('styles.css',source),new URL('styles.css',out));
await cp(new URL('theme-init.js',source),new URL('theme-init.js',out));
await cp(new URL('blog/blog.css',source),new URL('blog/blog.css',out));
await build({entryPoints:[fileURLToPath(new URL('../src/client/main.js',source))],outfile:fileURLToPath(new URL('site.js',out)),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,logLevel:'warning'});
await build({entryPoints:[fileURLToPath(new URL('blog/app.js',source))],outfile:fileURLToPath(new URL('blog/cloud-app.js',out)),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,define:esbuildDefines()});
// nginx serves CSS and JS as immutable for a year, so every page links them by a hash of their contents.
const ASSETS=['styles.css','blog/blog.css','blog/cloud-app.js','theme-init.js','site.js'];
const versions=new Map();
for(const asset of ASSETS)versions.set(asset,createHash('sha256').update(await readFile(new URL(asset,out))).digest('hex').slice(0,10));
function stamp(html){
 let stamped=html;
 for(const [asset,version] of versions)stamped=stamped.replace(new RegExp(`(src|href)="/?${asset.replace(/\./g,'\\.')}(\\?v=[^"]*)?"`,'g'),`$1="/${asset}?v=${version}"`);
 return stamped;
}
// Published journal posts snapshotted by scripts/fetch-posts.mjs; absent in local and pull-request builds.
let journal=[];
try{journal=JSON.parse(await readFile(new URL('blog/journal-posts.json',source),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
if(!Array.isArray(journal))throw Error('journal-posts.json must be an array');
const medium=JSON.parse(await readFile(new URL('blog/medium-posts.json',source),'utf8'));
const {content,menus,pages}=await buildPages({posts:[...journal,...medium],prerendered:new Set(journal.map(p=>p.slug))});
await mkdir(new URL('assets/og/',out),{recursive:true});
for(const page of pages){
 const target=new URL(page.file,out);
 await mkdir(new URL('./',target),{recursive:true});
 await writeFile(target,stamp(page.html));
 if(page.card)await writeFile(new URL('assets/og/'+page.card.name+'.jpg',out),await renderArticleCard({title:page.card.title,label:page.card.eyebrow}));
}
// Shared renderer runs locally against files and in production against Firebase.
const cloudPage=html=>stamp(html.replace('<body>',`<body data-cms="firebase" data-pages="${journal.map(p=>p.slug).join(' ')}">`).replace('src="/blog/app.js"','src="/blog/cloud-app.js"'));
// Prerender the same list the client renders, so swapping in live posts does not repaint the largest element.
const blogSource=await readFile(new URL('blog/index.html',source),'utf8');
const blogMain=/(<main id="app"[^>]*>)[\s\S]*?(<\/main>)/;
if(!blogMain.test(blogSource))throw Error('dist/blog/index.html has no <main id="app">');
const blogList=indexMarkup([...journal,...medium],journal.map(p=>p.slug));
const stampAttr=/ data-rendered="[0-9a-f]*"/;
const blog=cloudPage(blogSource.replace(blogMain,(_,open,close)=>open.replace(stampAttr,'').replace('<main id="app"',`<main id="app" data-rendered="${markupHash(blogList)}"`)+blogList+close));
await writeFile(new URL('blog/index.html',out),blog);
const template=renderBlogShell(await readFile(new URL('templates/blog.html',root),'utf8'),menus);
await writeFile(new URL('assets/andile-opengraph.jpg',out),await renderSiteCardJpeg({positioning:content.site.positioning}));
for(const post of journal){
 if(post.slug==='admin')throw Error('The slug "admin" is reserved for /blog/admin');
 await mkdir(new URL('blog/'+post.slug+'/',out),{recursive:true});
 await writeFile(new URL('blog/'+post.slug+'/index.html',out),cloudPage(renderPostPage(template,post)));
 await writeFile(new URL('assets/og/'+post.slug+'.jpg',out),await renderArticleCard({title:post.title,label:'Writing · '+dateLabel(post.date)}));
}
await cp(new URL('blog/medium-posts.json',source),new URL('blog/medium-posts.json',out));
await writeFile(new URL('robots.txt',out),renderRobots(origin));
await writeFile(new URL('sitemap.xml',out),renderSitemap(origin,journal,pages.filter(p=>p.file!=='404.html').map(p=>p.path)));
await writeFile(new URL('blog/feed.xml',out),renderFeed(origin,journal,medium));
// Published so the scheduled workflow can tell whether the live site is behind Firestore.
await writeFile(new URL('blog/journal-posts.json',out),JSON.stringify(journal,null,1)+'\n');
for(const route of ['admin','admin/posts','blog/admin']){
 await mkdir(new URL(route+'/',out),{recursive:true});
 await writeFile(new URL(route+'/index.html',out),blog.replace('<head>','<head><meta name="robots" content="noindex,nofollow">').replace(blogMain,(_,open,close)=>open.replace(stampAttr,'')+'<section class="blog-head"><h1>Admin.</h1><p>Loading workspace…</p></section>'+close));
}
console.log(`Exported ${pages.length} pages, the blog, and ${journal.length} journal post pages to `+fileURLToPath(out));
