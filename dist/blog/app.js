import {markdown,escapeHTML as e,blogSnippets} from './markdown.js';
import {indexMarkup,visiblePosts,archive,dateLabel} from './listing.js';
const app=document.querySelector('#app');
const reading=p=>`${Math.max(1,Math.ceil(p.content.trim().split(/\s+/).length/200))} min read`;
async function api(url,options){const r=await fetch(url,options);const data=await r.json();if(!r.ok)throw Error(data.error||'Request failed');return data;}
const meta=p=>`${e(dateLabel(p.date))} · ${p.source==='Medium'?'Medium':reading(p)}${p.tags.length?' · '+p.tags.map(e).join(', '):''}`;
function article(p){return `${p.coverImage?`<img class="cover" src="${e(p.coverImage)}" alt="">`:''}<p class="eyebrow">${meta(p)}</p><h1>${e(p.title)}</h1>${p.excerpt?`<p class="lead">${e(p.excerpt)}</p>`:''}<div class="prose">${markdown(p.content)}</div>`;}
async function publicPage(){
 const preview=document.body.dataset.preview==='true';
 const slug=preview?'':location.pathname.split('/')[2];
 const results=await Promise.allSettled(preview?[Promise.resolve([]),Promise.resolve(window.previewPosts)]:[api('/api/posts'),api('/blog/medium-posts.json')]);
 if(slug&&results[0].status==='rejected')throw results[0].reason;
 if(results.every(r=>r.status==='rejected'))throw Error('Writing is temporarily unavailable.');
 const native=results[0].status==='fulfilled'?results[0].value:[];
 const external=results[1].status==='fulfilled'?results[1].value:[];
 const posts=visiblePosts([...native,...external]);
 if(slug){
  const post=native.find(p=>p.slug===slug);
  if(!post){document.title='Post not found · Andile Jaden Mbele';app.innerHTML='<section class="blog-head"><h1>Post not found.</h1><p>This post is unavailable.</p><a href="/blog">Back to writing</a></section>';return;}
  document.title=`${post.title} · Andile Jaden Mbele`;
  app.innerHTML=`<section class="article"><a class="back-home" href="/blog">← All writing</a>${article(post)}<div class="article-end"><p>Andile Jaden Mbele</p><button id="copy-link" type="button">Copy article link</button><span id="copy-status" role="status"></span></div><nav id="related" aria-label="More writing"></nav></section>`;
  document.querySelector('meta[name="description"]').content=post.excerpt;
  const headings=[...app.querySelectorAll('.prose h2,.prose h3')];
  if(headings.length>2){const contents=document.createElement('details');contents.className='article-contents';contents.innerHTML='<summary>In this article</summary><ol>'+headings.map((h,i)=>{h.id='section-'+(i+1);return `<li><a href="#${h.id}">${e(h.textContent)}</a></li>`;}).join('')+'</ol>';app.querySelector('.prose').before(contents);}
  document.querySelector('#copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);document.querySelector('#copy-status').textContent='Link copied.';}catch{document.querySelector('#copy-status').textContent='Copy the address from your browser.';}};
  document.querySelector('#related').innerHTML='<h2 class="small-heading">More writing</h2>'+archive(posts.filter(p=>p!==post).slice(0,2));return;
 }
 app.innerHTML=indexMarkup(posts);
 if(!preview&&results.some(r=>r.status==='rejected')){const notice=document.createElement('p');notice.className='notice';notice.textContent='Some articles could not be loaded. The available writing is shown below.';document.querySelector('#latest').before(notice);}
 const search=document.querySelector('#search'),topic=document.querySelector('#topic'),source=document.querySelector('#source'),more=document.querySelector('#more'),reset=document.querySelector('#reset-filters');
 const params=new URLSearchParams(location.search);search.value=params.get('q')||'';topic.value=params.get('topic')||'';source.value=params.get('source')||'';let limit=6;
 document.querySelector('#browse').hidden=false;
 function filter(){const state={query:search.value,topic:topic.value,source:source.value},matched=visiblePosts(posts,state),active=Boolean(state.query||state.topic||state.source);document.querySelector('#latest').hidden=active;
 document.querySelector('#results').innerHTML=matched.length?archive(matched.slice(0,limit)):'<div class="empty"><h3>No matching articles.</h3><p>Try a different search or clear the filters.</p></div>';
 document.querySelector('#post-count').textContent=`${matched.length} ${matched.length===1?'article':'articles'}`;
 document.querySelector('#results-status').textContent=matched.length?`Showing ${Math.min(limit,matched.length)} of ${matched.length}`:'';
 more.hidden=matched.length<=limit;reset.hidden=!active;
 const url=new URL(location.href);for(const [k,v] of Object.entries({q:state.query,topic:state.topic,source:state.source})){if(v)url.searchParams.set(k,v);else url.searchParams.delete(k);}history.replaceState(null,'',url);
 }
 document.querySelector('#browse').onsubmit=event=>event.preventDefault();
 for(const input of [search,topic,source])input.addEventListener(input===search?'input':'change',()=>{limit=6;filter();});
 more.onclick=()=>{limit+=6;filter();};reset.onclick=()=>{search.value='';topic.value='';source.value='';limit=6;filter();search.focus();};filter();
}
async function editor(){document.title='Local editor · Andile Jaden Mbele';document.querySelector('meta[name="description"]').content='Local writing workspace';let token=(await api('/api/session')).token,originalSlug=null,dirty=false;
 app.innerHTML=`<section class="blog-head"><p class="eyebrow">Writing workspace</p><h1>Editor.</h1><p class="notice">Local only. Posts and images stay on this computer. Online publishing and sign-in need Andile’s own hosting setup.</p></section><div class="cms-layout"><aside><div class="actions"><button id="new" type="button">New post</button><button id="backup" type="button">Export all posts</button></div><h2 class="small-heading">Posts</h2><div id="post-list"></div></aside><section><form id="editor"><label>Title<input name="title" required maxlength="200"></label><div class="fields"><label>URL slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="100"></label><label>Date<input name="date" type="date" required></label></div><label>Short description<textarea name="excerpt" rows="2" maxlength="1000"></textarea></label><label>Tags, separated by commas<input name="tags" placeholder="Software, Infrastructure"></label><div class="fields"><label>Visibility on local blog<select name="status"><option value="draft">Draft (hidden)</option><option value="published">Visible locally</option></select></label><label>Cover image<input name="coverImage" readonly placeholder="No cover selected"></label></div><div class="actions"><label class="file-button">Add image<input id="image" type="file" accept="image/png,image/jpeg,image/webp"></label><button id="clear-cover" type="button">Remove cover</button><label class="file-button">Import Markdown<input id="import" type="file" accept=".md,.txt,text/markdown,text/plain"></label></div><p class="help">An uploaded image becomes the cover. Its Markdown is also inserted at the cursor; remove it from the body if you only want a cover.</p><div class="toolbar">${Object.keys(blogSnippets).map(k=>`<button type="button" data-snippet="${k}">${k}</button>`).join('')}</div><label>Body<textarea name="content" required rows="18" maxlength="200000" spellcheck="true" placeholder="Write in Markdown…"></textarea></label><p class="help">Headings, bold, italic, links, lists, code, quotes, images, and lede/stat/source blocks. Raw HTML is shown as text.</p><div class="actions"><button class="primary" type="submit">Save post locally</button><button id="preview" type="button" aria-expanded="false">Preview</button><button id="download" type="button">Export Markdown</button></div><p id="status" role="status" aria-live="polite"></p></form><section id="preview-body" class="article" hidden aria-label="Post preview"></section></section></div>`;
 const form=document.querySelector('#editor'),field=n=>form.elements.namedItem(n),status=document.querySelector('#status');
 function post(){return {title:field('title').value,slug:field('slug').value,excerpt:field('excerpt').value,date:field('date').value,tags:field('tags').value.split(',').map(t=>t.trim()).filter(Boolean),coverImage:field('coverImage').value,status:field('status').value,content:field('content').value};}
 function stash(){dirty=true;try{localStorage.setItem('andile-editor-recovery',JSON.stringify({post:post(),originalSlug}));status.textContent='Unsaved changes. Recovery copy stored in this browser.';}catch{status.textContent='Unsaved changes. Save to keep your work.';}if(!document.querySelector('#preview-body').hidden)renderPreview();}
 function populate(p,original=null){form.reset();for(const k of Object.keys(p))if(field(k))field(k).value=Array.isArray(p[k])?p[k].join(', '):p[k];originalSlug=original;dirty=false;document.querySelector('#preview-body').hidden=true;document.querySelector('#preview').setAttribute('aria-expanded','false');status.textContent='';}
 const blank=()=>({title:'',slug:'',excerpt:'',date:new Date().toISOString().slice(0,10),tags:[],coverImage:'',status:'draft',content:''});populate(blank());
 function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function list(){const posts=await api('/api/admin/posts');const list=document.querySelector('#post-list');list.innerHTML=posts.length?posts.sort((a,b)=>b.date.localeCompare(a.date)).map(p=>`<button class="post-select" type="button" data-slug="${e(p.slug)}">${e(p.title)}<small>${p.status==='draft'?'Draft':'Visible locally'} · ${e(p.date)}</small></button>`).join(''):'<p class="help">No saved posts yet.</p>';list.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(dirty&&!confirm('Discard unsaved changes and open this post?'))return;populate(posts.find(p=>p.slug===b.dataset.slug),b.dataset.slug);localStorage.removeItem('andile-editor-recovery');});}
 function renderPreview(){document.querySelector('#preview-body').innerHTML=article(post());}
 form.oninput=event=>{if(event.target===field('title')&&!originalSlug&&!field('slug').dataset.manual)field('slug').value=field('title').value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(event.target===field('slug'))field('slug').dataset.manual='1';stash();};
 form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;try{const p=await api('/api/admin/posts',{method:'POST',headers:{'Content-Type':'application/json','X-CMS-Token':token},body:JSON.stringify({post:post(),originalSlug})});originalSlug=p.slug;dirty=false;localStorage.removeItem('andile-editor-recovery');await list();status.textContent=p.status==='draft'?'Draft saved. Hidden from the local blog.':'Saved and visible on the local blog. Nothing was deployed.';}catch(error){status.textContent=error.message;}finally{button.disabled=false;}};
 document.querySelector('#new').onclick=()=>{if(dirty&&!confirm('Discard unsaved changes?'))return;populate(blank());delete field('slug').dataset.manual;localStorage.removeItem('andile-editor-recovery');};
 document.querySelector('#preview').onclick=()=>{const preview=document.querySelector('#preview-body');preview.hidden=!preview.hidden;document.querySelector('#preview').setAttribute('aria-expanded',String(!preview.hidden));if(!preview.hidden)renderPreview();};
 document.querySelector('#download').onclick=()=>download((post().slug||'draft')+'.md',post().content,'text/markdown');
 document.querySelector('#backup').onclick=async()=>{try{download('andile-posts.json',JSON.stringify(await api('/api/admin/posts'),null,2),'application/json');}catch(error){status.textContent=error.message;}};
 const insert=text=>{const area=field('content');area.setRangeText(text,area.selectionStart,area.selectionEnd,'end');area.focus();stash();};
 document.querySelectorAll('[data-snippet]').forEach(b=>b.onclick=()=>insert(blogSnippets[b.dataset.snippet]));
 document.querySelector('#clear-cover').onclick=()=>{field('coverImage').value='';stash();};
 document.querySelector('#image').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{const {url}=await api('/api/admin/media',{method:'POST',headers:{'X-CMS-Token':token},body:file});field('coverImage').value=url;insert(`\n![Describe this image](${url})\n`);status.textContent='Image saved locally.';}catch(error){status.textContent=error.message;}event.target.value='';};
 document.querySelector('#import').onchange=async event=>{const file=event.target.files[0];if(!file)return;if(file.size>200000){status.textContent='Choose a Markdown file smaller than 200 KB.';return;}if(field('content').value&&!confirm('Replace the current body with this Markdown file?'))return;field('content').value=await file.text();stash();event.target.value='';};
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 try{const raw=localStorage.getItem('andile-editor-recovery');if(raw){const recovery=JSON.parse(raw);populate(recovery.post,recovery.originalSlug);dirty=true;status.textContent='Recovered unsaved work from this browser. Save to keep it.';}}catch{}
 await list();
}
try{if(location.pathname==='/blog/admin')await editor();else await publicPage();}catch(error){app.innerHTML=`<section class="blog-head"><h1>Unable to load.</h1><p>${e(error.message)}</p><a href="${location.pathname==='/blog/admin'?'/blog/admin':'/blog'}">Try again</a></section>`;}
