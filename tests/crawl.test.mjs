import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderRobots,renderSitemap,renderFeed} from '../components/crawl-files.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const origin='https://andilembele.com';
const post={title:'Costs & <trade-offs>',slug:'costs',excerpt:'Short & sharp.',content:'Body',date:'2026-10-01',tags:[],coverImage:'',status:'published'};
const medium={title:'Older',date:'2026-03-08',tags:[],excerpt:'',url:'https://medium.com/@andilembele/older',source:'Medium'};

test('robots.txt keeps crawlers out of the CMS and points at the sitemap',()=>{
 const robots=renderRobots(origin);
 assert.match(robots,/^Disallow: \/admin\/$/m);
 assert.match(robots,/^Disallow: \/blog\/admin\/$/m);
 assert.match(robots,/^Sitemap: https:\/\/andilembele\.com\/sitemap\.xml$/m);
 assert.throws(()=>renderRobots(origin+'/'));
});

test('sitemap lists the homepage, writing index, and each journal post',()=>{
 const sitemap=renderSitemap(origin,[post]);
 assert.ok(sitemap.includes('<loc>https://andilembele.com/</loc>'));
 assert.ok(sitemap.includes('<loc>https://andilembele.com/blog/</loc>'));
 assert.ok(sitemap.includes('<url><loc>https://andilembele.com/blog/costs/</loc><lastmod>2026-10-01</lastmod></url>'));
 assert.throws(()=>renderSitemap(origin,[{...post,slug:'../x'}]));
});

test('feed merges journal and Medium posts newest first with escaped text',()=>{
 const feed=renderFeed(origin,[post],[medium]);
 assert.ok(feed.indexOf('Costs &amp; &lt;trade-offs&gt;')<feed.indexOf('Older'));
 assert.ok(feed.includes('<link>https://andilembele.com/blog/costs/</link>'));
 assert.ok(feed.includes('<link>https://medium.com/@andilembele/older</link>'));
 assert.ok(feed.includes('<pubDate>Thu, 01 Oct 2026 12:00:00 GMT</pubDate>'));
 assert.ok(feed.includes('<description>Short &amp; sharp.</description>'));
 assert.ok(!feed.includes('<description></description>'));
 assert.ok(feed.includes('<atom:link href="https://andilembele.com/blog/feed.xml" rel="self"'));
 assert.throws(()=>renderFeed(origin,[],[{...medium,url:'javascript:alert(1)'}]));
});

test('the public build ships crawl files, a small share card, and discovery links',async()=>{
 assert.match(await read('out/robots.txt'),/Sitemap:/);
 assert.match(await read('out/sitemap.xml'),/<urlset/);
 assert.match(await read('out/blog/feed.xml'),/<rss version="2.0"/);
 const card=await readFile(new URL('../out/assets/andile-opengraph.jpg',import.meta.url));
 assert.ok(card.length<=300_000);
 const home=await read('out/index.html');
 assert.match(home,/<link rel="canonical" href="https?:\/\/[^"]+\/">/);
 assert.match(home,/<link rel="alternate" type="application\/rss\+xml"[^>]+\/blog\/feed\.xml">/);
 const person=JSON.parse(home.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
 assert.equal(person['@type'],'Person');
 assert.ok(person.sameAs.includes('https://github.com/xeroxzen'));
 assert.match(home,/og:image" content="[^"]+\/assets\/andile-opengraph\.jpg"/);
 const blog=await read('out/blog/index.html');
 assert.ok(!blog.includes('rel="canonical"'),'the shell sets its canonical at runtime');
 const app=await read('dist/blog/app.js');
 assert.ok(app.includes("canonical('/blog/')"));
});
