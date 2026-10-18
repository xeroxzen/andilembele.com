import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {visiblePosts,postCard,postLink,indexMarkup} from '../dist/blog/listing.js';
const posts=JSON.parse(await readFile(new URL('../dist/blog/medium-posts.json',import.meta.url)));
test('archive combines search, topic and source and preserves date order',()=>{
 assert.equal(visiblePosts(posts,{query:'database rust'}).length,1);
 assert.equal(visiblePosts(posts,{topic:'data-cleaning'})[0].title,'Messy vCards with Pure Python, Pandas and Polars');
 assert.equal(visiblePosts(posts,{source:'Journal'}).length,0);
 const own={title:'Native post',excerpt:'',tags:['rust'],slug:'native',date:'2026-09-12',content:'Hello'};
 assert.equal(visiblePosts([...posts,own])[0],own);
 assert.equal(visiblePosts([...posts,own],{source:'Journal',topic:'rust'})[0],own);
 assert.equal(visiblePosts(posts,{query:'no matching title here'}).length,0);
});
test('article rendering escapes untrusted metadata and restricts external links',()=>{
 const p={...posts[0],title:'<script>alert(1)</script>',url:'javascript:alert(1)'};
 assert.ok(!postCard(p).includes('<script>'));
 assert.equal(postLink(p),'https://medium.com/@andilembele');
 assert.equal(postLink({...p,url:'https://medium.com.evil.test/'}),'https://medium.com/@andilembele');
 assert.equal(postLink({slug:'native'}),'/blog/?post=native');
});
test('built fallback includes real article links without needing JavaScript',async()=>{
 const html=await readFile(new URL('../dist/blog/index.html',import.meta.url),'utf8');
 for(const p of posts)assert.ok(html.includes(p.url));
 assert.ok(html.includes(indexMarkup(posts)));
 const preview=await readFile(new URL('../dist/blog-preview.html',import.meta.url),'utf8');
 assert.ok(!preview.includes('async function editor()'));
 assert.ok(!preview.includes('href="/blog/admin"'));
});
test('blog shell leaves og:url unset so shared article links keep their ?post= address',async()=>{
 const blog=await readFile(new URL('../out/blog/index.html',import.meta.url),'utf8');
 assert.ok(blog.includes('property="og:title"'));
 assert.ok(!blog.includes('property="og:url"'));
 const home=await readFile(new URL('../out/index.html',import.meta.url),'utf8');
 assert.ok(home.includes('property="og:url"'));
});
test('journal post pages carry the article title, description, and address for link previews',async()=>{
 const {renderPostPage,postSummary}=await import('../components/post-page.mjs');
 const template=await readFile(new URL('../templates/blog.html',import.meta.url),'utf8');
 const post={title:'Agents & "macOS"',slug:'local-agents',excerpt:'',content:'## Setup\nRun **one** <b>agent</b> per [user](https://example.com).\n\n'+'word '.repeat(80),date:'2026-10-01',tags:['ai'],coverImage:'',status:'published'};
 const summary=postSummary(post);
 assert.ok(summary.startsWith('Setup Run one <b>agent</b> per user.'));
 assert.ok(summary.length<=201&&summary.endsWith('…'));
 assert.equal(postSummary({...post,excerpt:' Short. '}),'Short.');
 const html=renderPostPage(template,post);
 assert.ok(html.includes('<title>Agents &amp; &quot;macOS&quot; · Andile Jaden Mbele</title>'));
 assert.ok(html.includes('<meta property="og:title" content="Agents &amp; &quot;macOS&quot;">'));
 assert.ok(html.includes('<meta property="og:type" content="article">'));
 assert.match(html,/<meta property="og:url" content="https?:\/\/[^"]+\/blog\/local-agents\/">/);
 assert.ok(html.includes('<meta name="description" content="Setup Run one &lt;b&gt;agent&lt;/b&gt;'));
 assert.ok(html.includes('<h1>Agents &amp; &quot;macOS&quot;</h1>'));
 assert.ok(!html.includes('{{'));
 assert.throws(()=>renderPostPage(template,{...post,status:'draft'}));
 assert.throws(()=>renderPostPage(template,{...post,slug:'../x'}));
});
test('article view moves prerendered posts to their shareable /blog/<slug>/ address',async()=>{
 const app=await readFile(new URL('../dist/blog/app.js',import.meta.url),'utf8');
 assert.ok(app.includes("document.body.dataset.pages||''"));
 assert.ok(app.includes("history.replaceState(null,'',pretty+location.hash)"));
 const shell=await readFile(new URL('../out/blog/index.html',import.meta.url),'utf8');
 assert.match(shell,/<body data-cms="firebase" data-pages="[a-z0-9 -]*">/);
});
