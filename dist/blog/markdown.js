// Authoring extensions adapted from three/src/lib/blog-markdown.ts (MIT).
// Raw HTML is deliberately rendered as text. Only safe URL schemes are linked.
export const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(s){return /^(https?:\/\/|mailto:|\/media\/)/i.test(s) ? s : '';}
function inline(s){return escapeHTML(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,a,u)=>safeURL(u)?`<img loading="lazy" src="${u}" alt="${a}">`:a).replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,a,u)=>safeURL(u)?`<a href="${u}" rel="noopener noreferrer">${a}</a>`:a);}
export function markdown(input){
 const lines=input.replace(/\r/g,'').split('\n');let html='',i=0;
 while(i<lines.length){let line=lines[i++];if(!line.trim())continue;
 if(line.startsWith('```')){let block=[];while(i<lines.length&&!lines[i].startsWith('```'))block.push(lines[i++]);i++;html+=`<pre><code>${escapeHTML(block.join('\n'))}</code></pre>`;continue;}
 if(/^:::(lede|stat|sources)$/.test(line)){const kind=line.slice(3),block=[];while(i<lines.length&&lines[i]!==':::')block.push(lines[i++]);i++;
 if(kind==='stat'){const fields=Object.fromEntries(block.map(l=>{let n=l.indexOf(':');return [l.slice(0,n).trim(),l.slice(n+1).trim()]}));html+=`<aside class="blog-stat"><span>${inline(fields.label||'')}</span><strong>${inline(fields.value||'')}</strong><p>${inline(fields.note||'')}</p></aside>`;}
 else html+=`<div class="blog-${kind}">${markdown(block.join('\n'))}</div>`;continue;}
 const h=line.match(/^(#{1,6})\s+(.+)$/);if(h){const n=Math.min(6,h[1].length+1);html+=`<h${n}>${inline(h[2])}</h${n}>`;continue;}
 if(line.startsWith('> ')){html+=`<blockquote>${inline(line.slice(2))}</blockquote>`;continue;}
 if(/^([-*]|\d+\.)\s/.test(line)){const ordered=/^\d/.test(line),tag=ordered?'ol':'ul';let items=[line];while(i<lines.length&&/^([-*]|\d+\.)\s/.test(lines[i]))items.push(lines[i++]);html+=`<${tag}>${items.map(l=>'<li>'+inline(l.replace(/^([-*]|\d+\.)\s+/,''))+'</li>').join('')}</${tag}>`;continue;}
 let p=[line];while(i<lines.length&&lines[i].trim()&&!/^(#|>|```|:::|[-*] |\d+\. )/.test(lines[i]))p.push(lines[i++]);html+=`<p>${inline(p.join('\n')).replace(/\n/g,'<br>')}</p>`;
 }return html;
}
export const blogSnippets={heading:'\n## Section title\n\n',quote:'\n> A key idea.\n\n',lede:':::lede\nYour opening paragraph.\n:::\n\n',stat:':::stat\nlabel: Metric\nvalue: Value\nnote: Context and source.\n:::\n\n',sources:':::sources\n1. [Source title](https://example.com)\n:::\n',code:'\n```\n// Code here\n```\n'};
