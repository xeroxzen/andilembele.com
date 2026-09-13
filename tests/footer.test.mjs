import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {renderFooter,socialLinks} from '../components/footer.mjs';
test('all local and public page builds share the complete footer and valid icons',async()=>{
 for(const page of ['dist/index.html','dist/blog/index.html','dist/blog-preview.html','out/index.html','out/blog/index.html','out/admin/index.html','out/404.html']){
  const html=await readFile(new URL('../'+page,import.meta.url),'utf8');
  const footers=html.match(/<footer>[\s\S]*?<\/footer>/g);
  assert.deepEqual(footers,[renderFooter()],page+' must render exactly one shared footer');
  for(const {url} of socialLinks)assert.ok(footers[0].includes(`href="${url}"`),page+' missing '+url);
 }
 for(const {icon} of socialLinks)await access(new URL('../out/assets/icons/'+icon+'.svg',import.meta.url));
 for(const page of ['home','blog']){
  const template=await readFile(new URL('../templates/'+page+'.html',import.meta.url),'utf8');
  assert.ok(template.includes('{{footer}}'));assert.ok(!template.includes('<footer>'));
 }
});
