import {readFile,writeFile} from 'node:fs/promises';
import {renderFooter} from '../components/footer.mjs';
import {indexMarkup} from '../dist/blog/listing.js';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
const posts=JSON.parse(await read('dist/blog/medium-posts.json'));
await writeFile(new URL('dist/index.html',root),(await read('templates/home.html')).replace('{{footer}}',renderFooter()));
let shell=(await read('templates/blog.html')).replace('{{footer}}',renderFooter()).replace('{{content}}',indexMarkup(posts));
shell=shell.replace('<title>Writing ·','<title>Blog ·');
await writeFile(new URL('dist/blog/index.html',root),shell);
// A self-contained public preview for static servers; never includes private posts or CMS access.
const strip=s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
let code=strip(await read('dist/blog/markdown.js'))+'\n'+strip(await read('dist/blog/listing.js'))+'\n'+strip(await read('dist/blog/app.js'));
code=code.replace("const app=document.querySelector('#app');","const e=escapeHTML;\nconst app=document.querySelector('#app');");
const editorStart=code.indexOf('async function editor()');
code=code.slice(0,editorStart)+'\nawait publicPage();';
const preview=shell.replace('<body>','<body data-preview="true">').replace('<script type="module" src="/blog/app.js"></script>','').replaceAll('href="/blog"','href="/blog-preview.html"').replace('</body>',`<script type="module">window.previewPosts=${JSON.stringify(posts).replaceAll('<','\\u003c')};\n${code.replaceAll('</script','<\\/script')}</script></body>`);
await writeFile(new URL('dist/blog-preview.html',root),preview);
console.log(`Built blog index and static preview with ${posts.length} Medium articles.`);
