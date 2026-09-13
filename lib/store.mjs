import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
export function validatePost(p){
 if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid post');
 for(const k of ['title','slug','excerpt','content','date','coverImage'])if(typeof p[k]!=='string')throw Error(`Missing ${k}`);
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)||p.slug.length>100)throw Error('Use a short lowercase slug with hyphens');
 if(!p.title.trim()||p.title.length>200||!p.content.trim()||p.content.length>200000||p.excerpt.length>1000)throw Error('Title and content are required and must fit the size limits');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||isNaN(Date.parse(p.date)))throw Error('Invalid date');
 if(!['draft','published'].includes(p.status))throw Error('Invalid status');
 if(p.coverImage&&!/^\/media\/[a-f0-9-]+\.(png|jpg|webp)$/.test(p.coverImage))throw Error('Choose a locally uploaded cover image');
 if(!Array.isArray(p.tags)||p.tags.length>10||p.tags.some(t=>typeof t!=='string'||t.length>40))throw Error('Use up to ten short tags');
 return Object.fromEntries(['title','slug','excerpt','content','date','coverImage','tags','status'].map(k=>[k,p[k]]));
}
export function createStore(directory){let queue=Promise.resolve();const filename=path.join(directory,'posts.json');
 async function list(){try{return JSON.parse(await readFile(filename,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
 function save(post,originalSlug){const task=queue.then(async()=>{const p=validatePost(post);const all=await list();if(all.some(x=>x.slug===p.slug&&x.slug!==originalSlug))throw Error('That slug already exists');if(originalSlug&&!all.some(x=>x.slug===originalSlug))throw Error('Original post not found');const next=all.filter(x=>x.slug!==originalSlug);next.push(p);await mkdir(directory,{recursive:true});await writeFile(filename+'.tmp',JSON.stringify(next,null,2));await rename(filename+'.tmp',filename);return p;});queue=task.catch(()=>{});return task;}
 function remove(slug){const task=queue.then(async()=>{const all=await list();if(!all.some(p=>p.slug===slug))throw Error('Post not found');await mkdir(directory,{recursive:true});await writeFile(filename+'.tmp',JSON.stringify(all.filter(p=>p.slug!==slug),null,2));await rename(filename+'.tmp',filename);});queue=task.catch(()=>{});return task;}
 return {list,save,remove};
}
