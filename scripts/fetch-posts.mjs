import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {loadEnv,requireEnv} from '../lib/env.mjs';
import {SLUG} from '../components/post-page.mjs';
// Snapshot of published journal posts for build:sites to render as static pages with link-preview tags.
loadEnv();
const MAX_POSTS=500;
const project=requireEnv('FIREBASE_PROJECT_ID'),key=requireEnv('FIREBASE_API_KEY'),site=requireEnv('SITE_URL');
const query={structuredQuery:{from:[{collectionId:'posts'}],where:{fieldFilter:{field:{fieldPath:'status'},op:'EQUAL',value:{stringValue:'published'}}},limit:MAX_POSTS}};
const response=await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents:runQuery?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json',Referer:site.replace(/\/?$/,'/')},body:JSON.stringify(query)});
if(!response.ok)throw Error(`Firestore query failed with HTTP ${response.status}: ${await response.text()}`);
const rows=await response.json();
assert.ok(Array.isArray(rows)&&rows.length<=MAX_POSTS+1,'Unexpected Firestore response');
const text=(fields,name)=>{const value=fields[name]?.stringValue;assert.equal(typeof value,'string',`Post field ${name} must be a string`);return value;};
const posts=rows.filter(row=>row.document).map(({document:{fields}})=>({
 title:text(fields,'title'),slug:text(fields,'slug'),excerpt:text(fields,'excerpt'),content:text(fields,'content'),date:text(fields,'date'),coverImage:text(fields,'coverImage'),status:text(fields,'status'),
 tags:(fields.tags?.arrayValue?.values||[]).map(v=>v.stringValue).filter(t=>typeof t==='string'),
}));
assert.ok(posts.length<MAX_POSTS,`Reached the ${MAX_POSTS}-post bound; raise MAX_POSTS`);
for(const post of posts)assert.ok(SLUG.test(post.slug),'Invalid slug from Firestore: '+post.slug);
await writeFile(new URL('../dist/blog/journal-posts.json',import.meta.url),JSON.stringify(posts,null,1)+'\n');
console.log(`Fetched ${posts.length} published journal posts.`);
