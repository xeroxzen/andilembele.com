import {readFile} from 'node:fs/promises';
import {notify,checkKey} from '../lib/notify.mjs';
// Usage: node scripts/notify-subscribers.mjs <posts live before this release> <posts in this release>
const [previousPath,currentPath]=process.argv.slice(2);
if(!previousPath||!currentPath)throw Error('Pass the previous and current journal-posts.json paths');
const apiKey=process.env.BUTTONDOWN_API_KEY,origin=String(process.env.SITE_URL||'').replace(/\/$/,'');
if(!apiKey){console.log('::warning::BUTTONDOWN_API_KEY is not set, so subscribers were not emailed.');process.exit(0);}
let previous;
// Without the previous list every post would look new, so send nothing rather than everything.
try{previous=JSON.parse(await readFile(previousPath,'utf8'));}catch(error){console.log(`::warning::Could not read the posts live before this release (${error.message}); no emails sent.`);process.exit(0);}
const current=JSON.parse(await readFile(currentPath,'utf8'));
const sent=await notify({previous,current,origin,apiKey,fetch});
if(sent.length)console.log(`Emailed subscribers about: ${sent.join(', ')}`);
else{const problem=await checkKey({apiKey,fetch});console.log(problem?`::warning::${problem}`:'No new posts to email. Buttondown API key works.');}
