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
 assert.equal(postLink({slug:'native'}),'/blog/native');
});
test('built fallback includes real article links without needing JavaScript',async()=>{
 const html=await readFile(new URL('../dist/blog/index.html',import.meta.url),'utf8');
 for(const p of posts)assert.ok(html.includes(p.url));
 assert.ok(html.includes(indexMarkup(posts)));
 const preview=await readFile(new URL('../dist/blog-preview.html',import.meta.url),'utf8');
 assert.ok(!preview.includes('async function editor()'));
 assert.ok(!preview.includes('href="/blog/admin"'));
});
