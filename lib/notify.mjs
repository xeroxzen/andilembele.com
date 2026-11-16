import assert from 'node:assert/strict';
// More new posts than this in one release is a restore or bulk import, not something to email.
export const MAX_NOTIFY=2;
// New means neither the slug nor the title was live before, so renaming a slug sends nothing.
export function newPosts(previous,current){
 assert.ok(Array.isArray(previous)&&Array.isArray(current),'Post lists must be arrays');
 const slugs=new Set(previous.map(p=>p.slug)),titles=new Set(previous.map(p=>p.title));
 return current.filter(p=>p.status==='published'&&!slugs.has(p.slug)&&!titles.has(p.title));
}
export function emailFor(post,origin){
 assert.match(origin,/^https:\/\/[^/]+$/,'origin must be https with no trailing slash');
 return {subject:post.title,body:`${post.excerpt.trim()?post.excerpt.trim()+'\n\n':''}[Read the post →](${origin}/blog/${post.slug}/)`};
}
// Read-only call so a bad key shows up on an ordinary deploy, not when a post goes out.
export async function checkKey({apiKey,fetch}){const response=await fetch('https://api.buttondown.com/v1/emails',{headers:{Authorization:'Token '+apiKey}});return response.ok?'':`Buttondown rejected the API key check with HTTP ${response.status}`;}
// Runs after the release is live, so a failure never resends: at most one email per post.
export async function notify({previous,current,origin,apiKey,fetch}){
 const fresh=newPosts(previous,current);
 if(fresh.length>MAX_NOTIFY)throw Error(`${fresh.length} new posts in one release looks like a restore or bulk import, so no emails were sent. Send any that are really new from Buttondown.`);
 const sent=[];
 for(const post of fresh){
  // Buttondown refuses to send through the API without this opt-in header (HTTP 400 sending_requires_confirmation).
  const response=await fetch('https://api.buttondown.com/v1/emails',{method:'POST',headers:{Authorization:'Token '+apiKey,'Content-Type':'application/json','X-Buttondown-Live-Dangerously':'true'},body:JSON.stringify({...emailFor(post,origin),status:'about_to_send'})});
  if(!response.ok)throw Error(`Buttondown rejected "${post.title}" with HTTP ${response.status}: ${await response.text()}`);
  sent.push(post.slug);
 }
 return sent;
}
