// Authoring extensions adapted from three/src/lib/blog-markdown.ts (MIT).
// Raw HTML is deliberately rendered as text. Only safe URL schemes are linked.
export const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(s){return /^(https?:\/\/|mailto:|\/media\/|\/assets\/)/i.test(s) ? s : '';}
const MD_MAX_DEPTH=8;
// Code spans are lifted out first so their contents never pick up bold, italics or links.
function inline(s){
 const codes=[];
 const text=escapeHTML(String(s).replace(/\u0000/g,'')).replace(/`([^`]+)`/g,(_,c)=>{codes.push(c);return `\u0000${codes.length-1}\u0000`;});
 return text.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/~~([^~]+)~~/g,'<del>$1</del>').replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,a,u)=>safeURL(u)?`<img loading="lazy" src="${u}" alt="${a}">`:a).replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,a,u)=>safeURL(u)?`<a href="${u}"${/^https?:/i.test(u)?' target="_blank"':''} rel="noopener noreferrer">${a}</a>`:a).replace(/&lt;br\s*\/?&gt;/gi,'<br>').replace(/\u0000(\d+)\u0000/g,(_,n)=>`<code>${codes[Number(n)]}</code>`);
}
const mdHashComments=/^(py|python|sh|bash|shell|zsh|console|yaml|yml|toml|ruby|rb|r|dockerfile|makefile|nginx|ini|conf)$/;
const mdKeywords=new Set('as async await break case catch class const continue crate def default defer del do done elif else enum esac except export extends false fi fn for from func if impl import in interface let loop match mod move mut new nil None not null or package pass pub raise ref return self Self static struct super switch then throw trait true True False try type typeof use var where while with yield'.split(' '));
// A small lexer: comments, strings, numbers, keywords and PascalCase types. Every character is matched, so all output is escaped.
function mdHighlight(code,lang){
 if(!lang)return escapeHTML(code);
 const comment=mdHashComments.test(lang)?'#[^\\n]*':lang==='sql'?'--[^\\n]*':'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/';
 const single=lang==='rust'||lang==='rs'?"'(?:\\\\.|[^'\\\\\\n])'":"'(?:\\\\.|[^'\\\\\\n])*'";
 const token=new RegExp(`(${comment})|("(?:\\\\.|[^"\\\\\\n])*"|${single}|\`(?:\\\\.|[^\`\\\\])*\`)|(\\b0x[\\da-fA-F]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?\\b)|([A-Za-z_]\\w*)|([\\s\\S])`,'g');
 return code.replace(token,(m,c,s,n,w)=>{
  const kind=c?'comment':s?'string':n?'number':w&&mdKeywords.has(w)?'keyword':w&&/^[A-Z][a-z]/.test(w)?'type':'';
  return kind?`<span class="tok-${kind}">${escapeHTML(m)}</span>`:escapeHTML(m);
 });
}
const mdItem=/^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const mdRule=/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const mdHr=/^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const mdCells=l=>l.trim().replace(/^\|/,'').replace(/(?<!\\)\|$/,'').split(/(?<!\\)\|/).map(c=>c.trim().replace(/\\\|/g,'|'));
const mdIsTable=(lines,i)=>lines[i].includes('|')&&i+1<lines.length&&lines[i+1].includes('-')&&lines[i+1].includes('|')&&mdRule.test(lines[i+1]);
const mdBlockStart=(lines,i)=>/^(#{1,6}\s|>|```|:::|<aside>\s*$)/.test(lines[i])||mdHr.test(lines[i])||mdItem.test(lines[i])||mdIsTable(lines,i);
function mdTable(rows){
 const head=mdCells(rows[0]),align=mdCells(rows[1]).map(c=>c.endsWith(':')?(c.startsWith(':')?'center':'right'):'');
 // Alignment is a class, not a style attribute, because the site's CSP blocks inline styles.
 const cell=(tag,text,k)=>`<${tag}${align[k]?` class="align-${align[k]}"`:''}>${inline(text)}</${tag}>`;
 const body=rows.slice(2).map(r=>{const cells=mdCells(r);return '<tr>'+head.map((_,k)=>cell('td',cells[k]||'',k)).join('')+'</tr>';}).join('');
 return `<div class="table-wrap"><table><thead><tr>${head.map((h,k)=>cell('th',h,k)).join('')}</tr></thead>${body?`<tbody>${body}</tbody>`:''}</table></div>`;
}
function mdDedent(lines){
 const indents=lines.filter(l=>l.trim()).map(l=>l.match(/^\s*/)[0].length);
 const cut=indents.length?Math.min(...indents):0;
 return lines.map(l=>l.slice(cut)).join('\n');
}
// Items at the list's own indent become <li>; deeper lines belong to the item above and render as nested Markdown.
function mdList(lines,depth){
 const first=lines[0].match(mdItem),base=first[1].length,ordered=/\d/.test(first[2]),items=[];
 for(const l of lines){const m=l.match(mdItem);if(m&&m[1].length<=base)items.push({text:m[3],children:[]});else items[items.length-1].children.push(l);}
 const li=item=>{
  const task=item.text.match(/^\[([ xX])\]\s+(.*)$/);
  const body=task?`<input type="checkbox" disabled${task[1]===' '?'':' checked'} aria-label="${task[1]===' '?'Not done':'Done'}">${inline(task[2])}`:inline(item.text);
  return `<li${task?' class="task"':''}>${body}${item.children.length?markdown(mdDedent(item.children),depth+1):''}</li>`;
 };
 const start=ordered&&parseInt(first[2],10)!==1?` start="${parseInt(first[2],10)}"`:'';
 return ordered?`<ol${start}>${items.map(li).join('')}</ol>`:`<ul>${items.map(li).join('')}</ul>`;
}
// GitHub alert syntax (> [!NOTE], optionally followed by a custom title) becomes a callout; any other quote stays a quote.
const mdCallouts={note:'Note',tip:'Tip',important:'Important',warning:'Warning',caution:'Caution'};
function mdQuote(lines,depth){
 const m=lines[0].match(/^\[!(note|tip|important|warning|caution)\]\s*(.*)$/i);
 if(!m)return `<blockquote>${markdown(lines.join('\n'),depth+1)}</blockquote>`;
 const kind=m[1].toLowerCase();
 return `<aside class="callout callout-${kind}"><p class="callout-title">${inline(m[2]||mdCallouts[kind])}</p>${markdown(lines.slice(1).join('\n'),depth+1)}</aside>`;
}
// Notion labels unhighlighted code "Plain Text"; treat it, and similar names, as no language.
const mdLangAliases={plaintext:'',text:'',plain:'',txt:''};
function mdLang(info){
 const lang=info.trim().toLowerCase().replace(/[^a-z0-9+#-]/g,'');
 return lang in mdLangAliases?mdLangAliases[lang]:lang;
}
// Notion exports callouts as <aside> blocks whose first line starts with the page icon (an emoji or an <img> tag).
function mdAside(lines,depth){
 const body=lines.join('\n').trim().replace(/^<img\b[^>]*>\s*/i,'');
 const icon=body.match(/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*/u);
 const rest=icon?body.slice(icon[0].length):body;
 return `<aside class="callout callout-note">${icon?`<span class="callout-icon" aria-hidden="true">${escapeHTML(icon[1])}</span>`:''}<div>${markdown(rest,depth+1)}</div></aside>`;
}
// A Notion export opens with the page title as "# Title"; the post already shows its title, so it moves to the title field.
export function importMarkdown(text){
 const lines=text.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
 const first=lines.findIndex(l=>l.trim());
 const title=first>=0?lines[first].match(/^#\s+(.+?)\s*$/):null;
 const raw=lines.join('\n');
 if(!title)return {title:'',content:raw,raw};
 return {title:title[1],content:lines.slice(first+1).join('\n').replace(/^\n+/,''),raw};
}
// Image references that point at files rather than web addresses, decoded the way a browser would resolve them.
const mdImageRef=/!\[([^\]]*)\]\(([^)\s]+)\)/g;
export function localImagePaths(content){
 const paths=new Set();
 for(const m of content.matchAll(mdImageRef))if(!safeURL(m[2])){try{paths.add(decodeURIComponent(m[2]));}catch{paths.add(m[2]);}}
 return [...paths];
}
export function relinkImages(content,urls){
 return content.replace(mdImageRef,(whole,alt,path)=>{let key=path;try{key=decodeURIComponent(path);}catch{}return urls.has(key)?`![${alt}](${urls.get(key)})`:whole;});
}
// A list runs through nested and continuation lines, and stops at a sibling item of the other kind (bullets vs numbers).
function mdListEnd(lines,start){
 const first=lines[start].match(mdItem),base=first[1].length,ordered=/\d/.test(first[2]);
 const belongs=l=>{const m=l.match(mdItem);return m?m[1].length>base||/\d/.test(m[2])===ordered:/^\s+\S/.test(l);};
 let i=start+1;
 while(i<lines.length&&(belongs(lines[i])||(!lines[i].trim()&&i+1<lines.length&&belongs(lines[i+1]))))i++;
 return i;
}
// Footnotes: "[^id]" in the text and "[^id]: note" on its own line. Only defined ids become links, and never inside code.
const mdFootnoteDef=/^\[\^([\w-]{1,32})\]:\s+(.+)$/;
const MD_MAX_FOOTNOTES=64;
function mdFootnotes(html,notes){
 if(!notes.size)return html;
 const ids=[...notes.keys()];
 const linked=html.split(/(<pre[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>)/).map((part,k)=>k%2?part:part.replace(/\[\^([\w-]{1,32})\]/g,(m,id)=>notes.has(id)?`<sup class="fn-ref"><a href="#fn-${id}" id="fnref-${id}">${ids.indexOf(id)+1}</a></sup>`:m)).join('');
 return linked+`<section class="footnotes" aria-label="Footnotes"><ol>${ids.map(id=>`<li id="fn-${id}">${inline(notes.get(id))} <a href="#fnref-${id}" aria-label="Back to text">↩</a></li>`).join('')}</ol></section>`;
}
export function markdown(input,depth=0){
 if(depth>MD_MAX_DEPTH)return `<p>${inline(input)}</p>`;
 let source=input.replace(/^\uFEFF/,'').replace(/\r/g,'');
 const notes=new Map();
 if(depth===0){
  source=source.split('\n').filter(l=>{const m=l.match(mdFootnoteDef);if(!m||notes.size>=MD_MAX_FOOTNOTES)return true;notes.set(m[1],m[2]);return false;}).join('\n');
 }
 const lines=source.split('\n');let html='',i=0;
 while(i<lines.length){let line=lines[i++];if(!line.trim())continue;
 if(line.startsWith('```')){const lang=mdLang(line.slice(3));let block=[];while(i<lines.length&&!lines[i].startsWith('```'))block.push(lines[i++]);i++;html+=`<pre${lang?` data-lang="${lang}"`:''}><code${lang?` class="language-${lang}"`:''}>${mdHighlight(block.join('\n'),lang)}</code></pre>`;continue;}
 if(/^:::(lede|stat|sources)$/.test(line)){const kind=line.slice(3),block=[];while(i<lines.length&&lines[i]!==':::')block.push(lines[i++]);i++;
 if(kind==='stat'){const fields=Object.fromEntries(block.map(l=>{let n=l.indexOf(':');return [l.slice(0,n).trim(),l.slice(n+1).trim()]}));html+=`<aside class="blog-stat"><span>${inline(fields.label||'')}</span><strong>${inline(fields.value||'')}</strong><p>${inline(fields.note||'')}</p></aside>`;}
 else html+=`<div class="blog-${kind}">${markdown(block.join('\n'),depth+1)}</div>`;continue;}
 const toggle=line.match(/^:::toggle\s+(.+)$/);
 if(toggle){const block=[];while(i<lines.length&&lines[i]!==':::')block.push(lines[i++]);i++;html+=`<details class="toggle"><summary>${inline(toggle[1])}</summary><div class="toggle-body">${markdown(block.join('\n'),depth+1)}</div></details>`;continue;}
 if(line.trim()==='<aside>'){const block=[];while(i<lines.length&&lines[i].trim()!=='</aside>')block.push(lines[i++]);i++;html+=mdAside(block,depth);continue;}
 const h=line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/);if(h){const n=Math.min(6,h[1].length+1);html+=`<h${n}>${inline(h[2])}</h${n}>`;continue;}
 if(mdHr.test(line)){html+='<hr>';continue;}
 if(line.startsWith('>')){const block=[line];while(i<lines.length&&lines[i].startsWith('>'))block.push(lines[i++]);html+=mdQuote(block.map(l=>l.replace(/^> ?/,'')),depth);continue;}
 if(mdIsTable(lines,i-1)){const rows=[line,lines[i++]];while(i<lines.length&&lines[i].trim()&&lines[i].includes('|'))rows.push(lines[i++]);html+=mdTable(rows);continue;}
 if(mdItem.test(line)){const end=mdListEnd(lines,i-1);html+=mdList(lines.slice(i-1,end),depth);i=end;continue;}
 let p=[line];while(i<lines.length&&lines[i].trim()&&!mdBlockStart(lines,i))p.push(lines[i++]);html+=`<p>${inline(p.join('\n')).replace(/\n/g,'<br>')}</p>`;
 }return depth===0?mdFootnotes(html,notes):html;
}
export const blogSnippets={heading:'\n## Section title\n\n',quote:'\n> A key idea.\n\n',callout:'\n> [!NOTE]\n> Something the reader should not miss.\n\n',table:'\n| Column | Column |\n| --- | --- |\n| Cell | Cell |\n\n',lede:':::lede\nYour opening paragraph.\n:::\n\n',stat:':::stat\nlabel: Metric\nvalue: Value\nnote: Context and source.\n:::\n\n',sources:':::sources\n1. [Source title](https://example.com)\n:::\n',code:'\n```rust\n// Code here\n```\n',toggle:'\n:::toggle Show the details\nHidden until the reader opens it.\n:::\n\n',footnote:'[^1]\n\n[^1]: The source or aside.\n'};
