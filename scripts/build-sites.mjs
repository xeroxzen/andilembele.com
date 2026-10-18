import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {build} from 'esbuild';
import {renderFooter} from '../components/footer.mjs';
import {renderPostPage} from '../components/post-page.mjs';
import {fileURLToPath} from 'node:url';
import {esbuildDefines, firebaseConfig, loadEnv} from '../lib/env.mjs';
loadEnv();
firebaseConfig();
const root=new URL('../',import.meta.url);
const source=new URL('dist/',root),out=new URL('out/',root);
await rm(out,{recursive:true,force:true});
await mkdir(new URL('blog/',out),{recursive:true});
await cp(new URL('assets/',source),new URL('assets/',out),{recursive:true});
await cp(new URL('styles.css',source),new URL('styles.css',out));
await cp(new URL('nav.js',source),new URL('nav.js',out));
await cp(new URL('blog/blog.css',source),new URL('blog/blog.css',out));
let home=await readFile(new URL('index.html',source),'utf8');
home=home.replace(/href="\/?styles\.css[^"]*"/,'href="/styles.css?v=editorial-3"');
await writeFile(new URL('index.html',out),home);
// Published journal posts snapshotted by scripts/fetch-posts.mjs; absent in local and pull-request builds.
let journal=[];
try{journal=JSON.parse(await readFile(new URL('blog/journal-posts.json',source),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
if(!Array.isArray(journal))throw Error('journal-posts.json must be an array');
// Shared renderer runs locally against files and in production against Firebase.
const cloudPage=html=>html.replace('<body>',`<body data-cms="firebase" data-pages="${journal.map(p=>p.slug).join(' ')}">`).replace('src="/blog/app.js"','src="/blog/cloud-app.js"');
const blog=cloudPage(await readFile(new URL('blog/index.html',source),'utf8'));
await writeFile(new URL('blog/index.html',out),blog);
const template=await readFile(new URL('templates/blog.html',root),'utf8');
for(const post of journal){
 if(post.slug==='admin')throw Error('The slug "admin" is reserved for /blog/admin');
 await mkdir(new URL('blog/'+post.slug+'/',out),{recursive:true});
 await writeFile(new URL('blog/'+post.slug+'/index.html',out),cloudPage(renderPostPage(template,post)));
}
await cp(new URL('blog/medium-posts.json',source),new URL('blog/medium-posts.json',out));
await build({entryPoints:[fileURLToPath(new URL('blog/app.js',source))],outfile:fileURLToPath(new URL('blog/cloud-app.js',out)),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,define:esbuildDefines()});
for(const route of ['admin','admin/posts','blog/admin']){
 await mkdir(new URL(route+'/',out),{recursive:true});
 await writeFile(new URL(route+'/index.html',out),blog.replace('<head>','<head><meta name="robots" content="noindex,nofollow">').replace(/<main id="app">[\s\S]*?<\/main>/,'<main id="app"><section class="blog-head"><h1>Admin.</h1><p>Loading workspace…</p></section></main>'));
}
await writeFile(new URL('404.html',out),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#fcfefc" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#0d120e" media="(prefers-color-scheme: dark)"><title>Page not found · Andile Jaden Mbele</title><link rel="stylesheet" href="/styles.css"><main class="page intro"><h1>Page not found.</h1><p class="about">Try the <a href="/">homepage</a> or <a href="/blog/">writing archive</a>.</p></main><div class="page">${renderFooter()}</div></html>`);
console.log(`Exported public portfolio, blog, and ${journal.length} journal post pages to `+fileURLToPath(out));
