import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createVerify} from 'node:crypto';
import {isDue,toLocalInput,fromLocalInput,localDate} from '../dist/blog/schedule.js';
import {serviceAccountToken,publishDue} from '../lib/scheduled.mjs';

const at='2026-12-01T06:00:00.000Z',now=Date.parse(at);
const json=(status,body)=>({status,ok:status>=200&&status<300,json:async()=>body,text:async()=>JSON.stringify(body)});
const row=(slug,status,publishAt)=>({document:{name:`projects/p/databases/(default)/documents/posts/${slug}`,updateTime:'2026-11-16T10:00:00.000000Z',fields:{status:{stringValue:status},...(publishAt?{publishAt:{stringValue:publishAt}}:{})}}});

test('a scheduled post is due only once its well-formed time has passed',()=>{
 assert.equal(isDue({status:'scheduled',publishAt:at},now),true);
 assert.equal(isDue({status:'scheduled',publishAt:at},now-1),false);
 assert.equal(isDue({status:'published',publishAt:at},now),false);
 assert.equal(isDue({status:'scheduled',publishAt:'2026-12-01'},now),false);
 assert.equal(isDue({status:'scheduled'},now),false);
});

test('editor times round-trip between the local picker and UTC',()=>{
 assert.equal(fromLocalInput(toLocalInput(at)),at);
 assert.equal(localDate(at),toLocalInput(at).slice(0,10));
 assert.equal(fromLocalInput(''),'');
 assert.equal(fromLocalInput('not a date'),'');
 assert.equal(toLocalInput(undefined),'');
});

test('publishDue flips only due posts and guards each write with the read updateTime',async()=>{
 const patches=[];
 const fetch=async(url,init)=>{
  if(url.endsWith(':runQuery')){assert.match(init.body,/"scheduled"/);return json(200,[row('due','scheduled',at),row('later','scheduled','2026-12-02T06:00:00.000Z'),row('busy','scheduled',at),{readTime:'x'}]);}
  patches.push(url);assert.equal(init.method,'PATCH');assert.deepEqual(JSON.parse(init.body),{fields:{status:{stringValue:'published'}}});
  return url.includes('/busy?')?json(400,{error:{status:'FAILED_PRECONDITION'}}):json(200,{});
 };
 assert.deepEqual(await publishDue({project:'p',token:'t',fetch,now}),['due']);
 assert.equal(patches.length,2);
 assert.match(patches[0],/posts\/due\?updateMask\.fieldPaths=status&updateMask\.fieldPaths=publishAt&currentDocument\.updateTime=2026-11-16T10%3A00%3A00\.000000Z$/);
});

test('publishDue stops on unexpected Firestore errors',async()=>{
 await assert.rejects(publishDue({project:'p',token:'t',fetch:async()=>json(403,{}),now}),/HTTP 403/);
 const fetch=async url=>url.endsWith(':runQuery')?json(200,[row('due','scheduled',at)]):json(500,{error:{status:'INTERNAL'}});
 await assert.rejects(publishDue({project:'p',token:'t',fetch,now}),/HTTP 500/);
});

test('service account token request carries a valid RS256 assertion',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const account={client_email:'publisher@p.iam.gserviceaccount.com',private_key:privateKey.export({type:'pkcs8',format:'pem'})};
 const fetch=async(url,init)=>{
  assert.equal(url,'https://oauth2.googleapis.com/token');
  const [head,claims,signature]=new URLSearchParams(init.body).get('assertion').split('.');
  assert.ok(createVerify('RSA-SHA256').update(head+'.'+claims).verify(publicKey,signature,'base64url'));
  const c=JSON.parse(Buffer.from(claims,'base64url'));
  assert.equal(c.iss,account.client_email);assert.equal(c.scope,'https://www.googleapis.com/auth/datastore');assert.equal(c.exp-c.iat,600);
  return json(200,{access_token:'token'});
 };
 assert.equal(await serviceAccountToken(account,fetch),'token');
 await assert.rejects(serviceAccountToken({},fetch),/service account key/);
 await assert.rejects(serviceAccountToken(account,async()=>json(401,{})),/HTTP 401/);
});
