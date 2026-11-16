import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {renderSocialMeta} from '../components/social-meta.mjs';
import {renderFooter} from '../components/footer.mjs';
import {renderBlogShell} from '../components/layout.mjs';
import {buildPages} from '../components/site.mjs';
import {indexMarkup,markupHash} from '../dist/blog/listing.js';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
const posts=JSON.parse(await read('dist/blog/medium-posts.json'));
// Local pages show Medium posts only; build-sites re-renders them with the published journal.
const {menus,pages}=await buildPages({posts,prerendered:new Set()});
for(const page of pages){
 if(page.file==='404.html')continue;
 const target=new URL('dist/'+page.file,root);
 await mkdir(new URL('./',target),{recursive:true});
 await writeFile(target,page.html);
}
const shell=renderBlogShell(await read('templates/blog.html'),menus).replace('{{footer}}',()=>renderFooter()).replace('{{socialMeta}}',()=>renderSocialMeta({blog:true})).replace('{{content}}',()=>indexMarkup(posts)).replace('<main id="app"',`<main id="app" data-rendered="${markupHash(indexMarkup(posts))}"`);
await writeFile(new URL('dist/blog/index.html',root),shell);
// One bundle for every page's interactive parts: menus, theme, database views, reveal, and the widgets.
await build({entryPoints:[fileURLToPath(new URL('src/client/main.js',root))],outfile:fileURLToPath(new URL('dist/site.js',root)),bundle:true,format:'esm',platform:'browser',target:'es2022',logLevel:'warning'});
// A self-contained public preview for static servers; never includes private posts or CMS access.
const strip=s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
let code=strip(await read('dist/blog/markdown.js'))+'\n'+strip(await read('dist/blog/listing.js'))+'\n'+strip(await read('dist/blog/app.js'));
code=code.replace("const app=document.querySelector('#app');","const e=escapeHTML;\nconst app=document.querySelector('#app');");
const editorStart=code.indexOf('async function editor()');
code=code.slice(0,editorStart).replace("const cloud=remote?await import('./firebase-client.js'):null;","const cloud=null;")+'\nawait publicPage();';
const preview=shell.replace('<body>','<body data-preview="true">').replace('<script type="module" src="/blog/app.js" fetchpriority="low"></script>','').replaceAll('href="/blog/"','href="/blog-preview.html"').replace('</body>',`<script type="module">window.previewPosts=${JSON.stringify(posts).replaceAll('<','\\u003c')};\n${code.replaceAll('</script','<\\/script')}</script></body>`);
await writeFile(new URL('dist/blog-preview.html',root),preview);
console.log(`Built ${pages.length-1} pages, the blog index, and a static preview with ${posts.length} Medium articles.`);
