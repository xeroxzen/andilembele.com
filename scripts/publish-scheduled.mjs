import {loadEnv,requireEnv} from '../lib/env.mjs';
import {serviceAccountToken,publishDue} from '../lib/scheduled.mjs';
// Runs in CI before fetch-posts, so a post whose time has come is in the same build's snapshot.
loadEnv();
const raw=process.env.FIREBASE_SERVICE_ACCOUNT;
if(!raw){console.log('::warning::FIREBASE_SERVICE_ACCOUNT is not set, so scheduled posts were not published.');process.exit(0);}
const token=await serviceAccountToken(JSON.parse(raw),fetch);
const published=await publishDue({project:requireEnv('FIREBASE_PROJECT_ID'),token,fetch});
console.log(published.length?`Published scheduled posts: ${published.join(', ')}`:'No scheduled posts are due.');
