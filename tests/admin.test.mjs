import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHandler} from '../server.mjs';
test('admin password protects drafts and writes; logout revokes access',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'andile-admin-'));
 const handler=createHandler({directory,port:4175,password:'test-password-long'});
 async function request(url,{method='GET',headers={},body}={}){
  const req=Readable.from(body?[Buffer.from(JSON.stringify(body))]:[]);req.url=url;req.method=method;req.headers={host:'127.0.0.1:4175',...headers};
  const res={status:200,headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(s,h){this.status=s;Object.assign(this.headers,h);},end(b){this.body=String(b);}};
  await handler(req,res);return res;
 }
 try{
  assert.equal((await request('/admin')).status,200);
  assert.equal((await request('/admin/posts')).status,200);
  assert.equal((await request('/api/admin/posts')).status,401);
  assert.equal((await request('/api/session')).status,401);
  assert.equal((await request('/api/login',{method:'POST',body:{password:'test-password-long'}})).status,403);
  const origin='http://127.0.0.1:4175';
  assert.equal((await request('/api/login',{method:'POST',headers:{origin},body:{password:'wrong'}})).status,401);
  const login=await request('/api/login',{method:'POST',headers:{origin},body:{password:'test-password-long'}});
  assert.equal(login.status,200);assert.match(login.headers['Set-Cookie'],/HttpOnly; SameSite=Strict/);
  const cookie=login.headers['Set-Cookie'].split(';')[0];
  const session=JSON.parse((await request('/api/session',{headers:{cookie}})).body);
  const headers={cookie,origin,'x-cms-token':session.token};
  const post={title:'Private draft',slug:'private-draft',excerpt:'',content:'Draft text',date:'2026-09-12',tags:[],coverImage:'',status:'draft'};
  assert.equal((await request('/api/admin/posts',{method:'POST',headers,body:{post}})).status,200);
  assert.deepEqual(JSON.parse((await request('/api/posts')).body),[]);
  assert.equal(JSON.parse((await request('/api/admin/posts',{headers:{cookie}})).body).length,1);
  assert.equal((await request('/api/admin/posts/private-draft',{method:'DELETE',headers:{cookie,origin}})).status,403);
  assert.equal((await request('/api/admin/posts/private-draft',{method:'DELETE',headers})).status,200);
  assert.deepEqual(JSON.parse((await request('/api/admin/posts',{headers:{cookie}})).body),[]);
  assert.equal((await request('/api/logout',{method:'POST',headers})).status,200);
  assert.equal((await request('/api/admin/posts',{headers:{cookie}})).status,401);
  for(let i=0;i<5;i++)await request('/api/login',{method:'POST',headers:{origin},body:{password:'wrong'}});
  assert.equal((await request('/api/login',{method:'POST',headers:{origin},body:{password:'test-password-long'}})).status,429);
 }finally{await rm(directory,{recursive:true,force:true});}
});
