import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newPosts,emailFor,notify,checkKey,MAX_NOTIFY} from '../lib/notify.mjs';
import {subscribeMarkup} from '../dist/blog/listing.js';

const post=(slug,title=slug,excerpt='')=>({slug,title,excerpt,status:'published'});
const origin='https://andilembele.com';
const json=(status,body)=>({status,ok:status>=200&&status<300,text:async()=>JSON.stringify(body)});

test('only posts whose slug and title are both unseen count as new',()=>{
 const before=[post('a'),post('b','B title')];
 assert.deepEqual(newPosts(before,[...before,post('c')]).map(p=>p.slug),['c']);
 assert.deepEqual(newPosts(before,[post('a'),post('b-renamed','B title')]),[]);
 assert.deepEqual(newPosts(before,before),[]);
 assert.throws(()=>newPosts(null,before));
});

test('email links to the post and leads with the excerpt',()=>{
 assert.deepEqual(emailFor(post('c','C','Short.'),origin),{subject:'C',body:'Short.\n\n[Read the post →](https://andilembele.com/blog/c/)'});
 assert.equal(emailFor(post('c'),origin).body,'[Read the post →](https://andilembele.com/blog/c/)');
 assert.throws(()=>emailFor(post('c'),origin+'/'));
});

test('notify sends each new post once and refuses bulk changes',async()=>{
 const calls=[];
 const fetch=async(url,init)=>{calls.push(JSON.parse(init.body));assert.equal(url,'https://api.buttondown.com/v1/emails');assert.equal(init.headers.Authorization,'Token k');assert.equal(init.headers['X-Buttondown-Live-Dangerously'],'true');return json(201,{});};
 assert.deepEqual(await notify({previous:[post('a')],current:[post('a'),post('c')],origin,apiKey:'k',fetch}),['c']);
 assert.equal(calls[0].status,'about_to_send');assert.equal(calls[0].subject,'c');
 assert.deepEqual(await notify({previous:[post('a')],current:[post('a')],origin,apiKey:'k',fetch}),[]);
 const bulk=Array.from({length:MAX_NOTIFY+1},(_,i)=>post('n'+i));
 await assert.rejects(notify({previous:[],current:bulk,origin,apiKey:'k',fetch}),/bulk import/);
 assert.equal(calls.length,1);
 await assert.rejects(notify({previous:[],current:[post('x')],origin,apiKey:'k',fetch:async()=>json(400,{})}),/HTTP 400/);
});

test('key check reads without sending',async()=>{
 assert.equal(await checkKey({apiKey:'k',fetch:async(url,init)=>{assert.equal(init.method,undefined);assert.equal(init.headers.Authorization,'Token k');return json(200,{});}}),'');
 assert.match(await checkKey({apiKey:'k',fetch:async()=>json(401,{})}),/HTTP 401/);
});

test('signup form appears only with a valid newsletter name',()=>{
 assert.equal(subscribeMarkup(''),'');
 assert.equal(subscribeMarkup('bad"name'),'');
 const form=subscribeMarkup('andile');
 assert.match(form,/action="https:\/\/buttondown\.com\/api\/emails\/embed-subscribe\/andile" method="post"/);
 assert.match(form,/<input id="subscribe-email" type="email" name="email" required/);
});
