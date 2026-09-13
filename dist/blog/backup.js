export function parseBackup(text){
 const posts=JSON.parse(text);
 if(!Array.isArray(posts)||!posts.length||posts.length>100)throw Error('Choose a backup containing 1–100 posts.');
 const seen=new Set();
 return posts.map(p=>{
  if(!p||typeof p!=='object'||typeof p.slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)||p.slug.length>100||seen.has(p.slug))throw Error('Backup contains an invalid or duplicate slug.');
  seen.add(p.slug);
  for(const [key,max,required] of [['title',200,true],['content',200000,true],['excerpt',1000,false]])if(typeof p[key]!=='string'||p[key].length>max||(required&&!p[key].trim()))throw Error('Backup contains invalid post text.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Array.isArray(p.tags)||p.tags.length>10||p.tags.some(t=>typeof t!=='string'||t.length>40)||p.coverImage!=='')throw Error('Backup contains invalid metadata or unsupported media.');
  return {title:p.title,slug:p.slug,excerpt:p.excerpt,content:p.content,date:p.date,tags:p.tags,coverImage:'',status:'draft'};
 });
}
