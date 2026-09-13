import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseBackup} from '../dist/blog/backup.js';
const p={title:'A post',slug:'a-post',excerpt:'Summary',content:'# Content',date:'2026-09-13',tags:['Software'],coverImage:'',status:'published'};
test('backup round trip preserves content but restores privately',()=>{
 assert.deepEqual(parseBackup(JSON.stringify([p])),[{...p,status:'draft'}]);
});
test('restore refuses duplicate slugs, malformed text and unsupported media',()=>{
 for(const data of [[p,p],[{...p,slug:'../oops'}],[{...p,content:null}],[{...p,coverImage:'https://example.com/image'}]])assert.throws(()=>parseBackup(JSON.stringify(data)));
});
