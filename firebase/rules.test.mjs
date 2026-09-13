import {test} from 'node:test';
import {restorePosts} from '../dist/blog/restore.js';
import {parseBackup} from '../dist/blog/backup.js';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,deleteDoc,collection,query,where} from 'firebase/firestore';
import {adminEmails} from '../lib/env.mjs';
const emails=adminEmails();
assert.ok(emails.length>=2,'CMS_ADMIN_EMAILS needs two addresses for the dual-admin rules test');
const env=await initializeTestEnvironment({projectId:'demo-andile-cms',firestore:{host:'127.0.0.1',port:8088,rules:await readFile(new URL('./firestore.rules',import.meta.url),'utf8')}});
const post={title:'Test',slug:'test',excerpt:'',content:'Private text',date:'2026-09-13',coverImage:'',tags:['Systems'],status:'draft'};
function user(email,verified=true,provider='google.com'){return env.authenticatedContext(email,{email,email_verified:verified,firebase:{sign_in_provider:provider}}).firestore();}
test('only both verified Google administrators can manage posts; public sees published only',async()=>{
 try{
  const owner=user(emails[0]),andile=user(emails[1]),stranger=user('visitor@example.com'),anonymous=env.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(owner,'posts/test'),post));
  await assertSucceeds(getDoc(doc(andile,'posts/test')));
  await assertFails(getDoc(doc(stranger,'posts/test')));await assertFails(getDoc(doc(anonymous,'posts/test')));
  await assertFails(getDocs(collection(stranger,'posts')));
  await assertFails(setDoc(doc(stranger,'posts/test'),{...post,status:'published'}));
  await assertFails(setDoc(doc(user(emails[0],false),'posts/test'),post));
  await assertFails(setDoc(doc(user(emails[0],true,'password'),'posts/test'),post));
  await assertFails(setDoc(doc(owner,'posts/test'),{...post,admin:true}));
  await assertFails(setDoc(doc(owner,'posts/test'),{...post,tags:[{}]}));
  await assertFails(setDoc(doc(owner,'posts/test'),{...post,slug:'different'}));
  await assertFails(setDoc(doc(owner,'posts/test'),{...post,coverImage:'https://invalid.test/a.jpg'}));
  await assertSucceeds(setDoc(doc(andile,'posts/test'),{...post,status:'published'}));
  assert.equal((await assertSucceeds(getDoc(doc(anonymous,'posts/test')))).data().status,'published');
  assert.equal((await assertSucceeds(getDocs(query(collection(anonymous,'posts'),where('status','==','published'))))).size,1);
  await assertFails(getDocs(collection(anonymous,'posts')));
  await assertFails(deleteDoc(doc(stranger,'posts/test')));
  await assertSucceeds(deleteDoc(doc(andile,'posts/test')));
  const exported=JSON.stringify([{...post,status:'published'}]);
  await restorePosts(owner,parseBackup(exported));
  assert.deepEqual((await getDoc(doc(owner,'posts/test'))).data(),post);
  await assertFails(getDoc(doc(anonymous,'posts/test')));
  await assert.rejects(restorePosts(owner,[{...post,slug:'new-post'},post]));
  assert.equal((await getDoc(doc(owner,'posts/new-post'))).exists(),false);
  await deleteDoc(doc(owner,'posts/test'));
  await assertFails(setDoc(doc(owner,'settings/admins'),{emails:['visitor@example.com']}));
 }finally{await env.cleanup();}
});
