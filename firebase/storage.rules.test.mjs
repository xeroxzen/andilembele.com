import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,uploadBytes,getBytes,listAll,deleteObject} from 'firebase/storage';
import {adminEmails} from '../lib/env.mjs';
const emails=adminEmails();
const env=await initializeTestEnvironment({projectId:'demo-andile-cms',storage:{host:'127.0.0.1',port:9199,rules:await readFile(new URL('./storage.rules',import.meta.url),'utf8')}});
const png=new Uint8Array([137,80,78,71,13,10,26,10]);
const name='posts/0b6f3c2e-8d4a-4f1e-9c7b-2a5d6e8f9a10.png';
function user(email,verified=true,provider='google.com'){return env.authenticatedContext(email,{email,email_verified:verified,firebase:{sign_in_provider:provider}}).storage();}
test('only verified Google administrators upload small images with random names',async()=>{
 try{
  const owner=user(emails[0]),stranger=user('visitor@example.com'),anonymous=env.unauthenticatedContext().storage();
  await assertFails(uploadBytes(ref(anonymous,name),png,{contentType:'image/png'}));
  await assertFails(uploadBytes(ref(stranger,name),png,{contentType:'image/png'}));
  await assertFails(uploadBytes(ref(user(emails[0],false),name),png,{contentType:'image/png'}));
  await assertFails(uploadBytes(ref(owner,name),png,{contentType:'image/svg+xml'}));
  await assertFails(uploadBytes(ref(owner,'posts/chosen-name.png'),png,{contentType:'image/png'}));
  await assertFails(uploadBytes(ref(owner,'other/'+name.slice(6)),png,{contentType:'image/png'}));
  await assertFails(uploadBytes(ref(owner,name),new Uint8Array(5*1024*1024+1),{contentType:'image/png'}));
  await assertSucceeds(uploadBytes(ref(owner,name),png,{contentType:'image/png'}));
  await assertSucceeds(getBytes(ref(owner,name)));
  await assertFails(getBytes(ref(anonymous,name)));
  await assertFails(listAll(ref(anonymous,'posts')));
  await assertFails(deleteObject(ref(stranger,name)));
  await assertSucceeds(deleteObject(ref(owner,name)));
 }finally{await env.cleanup();}
});
