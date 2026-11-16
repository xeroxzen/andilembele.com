import assert from 'node:assert/strict';
import {createSign} from 'node:crypto';
import {isDue} from '../dist/blog/schedule.js';
const MAX_SCHEDULED=100;
const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
export async function serviceAccountToken(account,fetch,now=Date.now()){
 assert.ok(account?.client_email&&account?.private_key,'FIREBASE_SERVICE_ACCOUNT must be a service account key in JSON');
 const iat=Math.floor(now/1000);
 const unsigned=b64({alg:'RS256',typ:'JWT'})+'.'+b64({iss:account.client_email,scope:'https://www.googleapis.com/auth/datastore',aud:'https://oauth2.googleapis.com/token',iat,exp:iat+600});
 const assertion=unsigned+'.'+createSign('RSA-SHA256').update(unsigned).sign(account.private_key,'base64url');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
 if(!response.ok)throw Error(`Service account sign-in failed with HTTP ${response.status}`);
 const {access_token:token}=await response.json();
 assert.equal(typeof token,'string','Token response had no access_token');
 return token;
}
// Flips due scheduled posts to published. The updateTime precondition skips a post edited since it was read.
export async function publishDue({project,token,fetch,now=Date.now()}){
 const api='https://firestore.googleapis.com/v1/';
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const query={structuredQuery:{from:[{collectionId:'posts'}],where:{fieldFilter:{field:{fieldPath:'status'},op:'EQUAL',value:{stringValue:'scheduled'}}},limit:MAX_SCHEDULED}};
 const response=await fetch(`${api}projects/${encodeURIComponent(project)}/databases/(default)/documents:runQuery`,{method:'POST',headers,body:JSON.stringify(query)});
 if(!response.ok)throw Error(`Firestore query failed with HTTP ${response.status}: ${await response.text()}`);
 const rows=await response.json();
 assert.ok(Array.isArray(rows)&&rows.length<=MAX_SCHEDULED+1,'Unexpected Firestore response');
 const due=rows.filter(r=>r.document&&isDue({status:r.document.fields.status?.stringValue,publishAt:r.document.fields.publishAt?.stringValue},now));
 const published=[];
 for(const {document} of due){
  const url=`${api}${document.name}?updateMask.fieldPaths=status&updateMask.fieldPaths=publishAt&currentDocument.updateTime=${encodeURIComponent(document.updateTime)}`;
  const patch=await fetch(url,{method:'PATCH',headers,body:JSON.stringify({fields:{status:{stringValue:'published'}}})});
  if(!patch.ok){
   const body=await patch.text();
   if(body.includes('FAILED_PRECONDITION')){console.warn(`Skipped ${document.name}: it was edited while publishing; the next run retries.`);continue;}
   throw Error(`Publishing ${document.name} failed with HTTP ${patch.status}: ${body}`);
  }
  published.push(document.name.split('/').pop());
 }
 return published;
}
