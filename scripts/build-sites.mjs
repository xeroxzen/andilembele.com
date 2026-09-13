import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {renderFooter} from '../components/footer.mjs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const source=new URL('dist/',root),out=new URL('out/',root);
await rm(out,{recursive:true,force:true});
await mkdir(new URL('blog/',out),{recursive:true});
await cp(new URL('assets/',source),new URL('assets/',out),{recursive:true});
await cp(new URL('styles.css',source),new URL('styles.css',out));
await cp(new URL('blog/blog.css',source),new URL('blog/blog.css',out));
let home=await readFile(new URL('index.html',source),'utf8');
home=home.replace('href="styles.css"','href="/styles.css?v=terminal-green-2"');
await writeFile(new URL('index.html',out),home);
// Export only public writing. The local editor and data store are not deployed.
const preview=await readFile(new URL('blog-preview.html',source),'utf8');
const match=preview.match(/<script type="module">([\s\S]*?)<\/script>/);
if(!match)throw Error('Run npm run build before exporting Sites assets');
const blog=preview.replace(match[0],'<script type="module" src="/blog/public.js"></script>').replaceAll('/blog-preview.html','/blog/').replace('href="/styles.css"','href="/styles.css?v=terminal-green-2"');
await writeFile(new URL('blog/index.html',out),blog);
await writeFile(new URL('blog/public.js',out),match[1]);
await writeFile(new URL('404.html',out),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found · Andile Jaden Mbele</title><link rel="stylesheet" href="/styles.css"><main class="page intro"><h1>Page not found.</h1><p class="about">Try the <a href="/">homepage</a> or <a href="/blog/">writing archive</a>.</p></main><div class="page">${renderFooter()}</div></html>`);
console.log('Exported public portfolio and blog to '+fileURLToPath(out));

await mkdir(new URL('admin/',out),{recursive:true});
await writeFile(new URL('admin/index.html',out),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>Admin · Andile Jaden Mbele</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/blog/blog.css"></head><body><div class="page"><header class="topbar"><a class="wordmark" href="/">ajm.</a><a href="/blog">Writing</a></header><main><section class="blog-head"><p class="eyebrow">Private workspace</p><h1>Admin.</h1><p class="notice">Online administration is not connected yet.</p><p class="about">The local workspace supports posts, drafts, previews, images, and backups. Sign-in and online publishing will be available after the owner connects the backend.</p></section><section class="admin-panel"><h2>Owner setup</h2><p>Connect your own hosting, administrator authentication, database, and media storage. Follow the setup guide included with the website repository.</p><p>No drafts or editing controls are exposed on this public page.</p><a href="/">Back to website →</a></section></main>${renderFooter()}</div></body></html>`);
