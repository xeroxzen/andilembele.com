import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {randomUUID,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {createStore} from './lib/store.mjs';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
export function createHandler({directory=fileURLToPath(new URL('./data/',import.meta.url)),port=4173,password=process.env.CMS_ADMIN_PASSWORD}={}){
const data=directory;
const store=createStore(data),csrf=randomBytes(32).toString('hex');
const host=`127.0.0.1:${port}`;
if(password&&password.length<12)throw Error('CMS_ADMIN_PASSWORD must have at least 12 characters');
const passwordHash=password?scryptSync(password,'andile-local-admin',32):null;
const sessions=new Map();let failures=0,blockedUntil=0;
function authenticated(req){if(!passwordHash)return true;const id=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cms_session='))?.slice(12);const expiry=sessions.get(id);if(!expiry||expiry<Date.now()){sessions.delete(id);return false;}sessions.set(id,Date.now()+30*60*1000);return true;}

const types={'.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
function json(res,value,status=200){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req,limit=300000){let chunks=[],n=0;for await(const c of req){n+=c.length;if(n>limit)throw Error('File or request is too large');chunks.push(c);}return Buffer.concat(chunks);}
return async(req,res)=>{try{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 if(req.headers.host!==host){json(res,{error:'This preview accepts local connections only'},403);return;}
 const pathname=decodeURIComponent(new URL(req.url,`http://${host}`).pathname);
 if(pathname.startsWith('/admin')||pathname==='/blog/admin')res.setHeader('X-Robots-Tag','noindex, nofollow');
 if(pathname.startsWith('/api/')){
 if(pathname==='/api/login'&&req.method==='POST'){
  if(req.headers.origin!==`http://${host}`)return json(res,{error:'Invalid origin'},403);
  if(Date.now()<blockedUntil)return json(res,{error:'Too many attempts. Try again in a minute.'},429);
  const input=JSON.parse((await body(req,2000)).toString()).password;
  if(!passwordHash||typeof input!=='string'||!timingSafeEqual(scryptSync(input,'andile-local-admin',32),passwordHash)){
   if(++failures>=5){blockedUntil=Date.now()+60000;failures=0;}return json(res,{error:'Incorrect password'},401);
  }
  failures=0;const id=randomBytes(32).toString('hex');sessions.set(id,Date.now()+30*60*1000);
  res.setHeader('Set-Cookie',`cms_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800`);return json(res,{ok:true});
 }
 if(pathname==='/api/session'||pathname.startsWith('/api/admin/')||pathname==='/api/logout'){
  if(!authenticated(req))return json(res,{error:'Sign in to continue',loginRequired:true},401);
 }

 if(req.method==='GET'){
 if(pathname==='/api/session')return json(res,{token:csrf,mode:'local',passwordProtected:Boolean(passwordHash)});
 if(pathname==='/api/posts')return json(res,(await store.list()).filter(p=>p.status==='published'));
 if(pathname==='/api/admin/posts')return json(res,await store.list());
 }else{
 if(req.headers.origin!==`http://${host}`||req.headers['x-cms-token']!==csrf)return json(res,{error:'Reload the editor before saving'},403);
 if(req.method==='POST'&&pathname==='/api/logout'){const id=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cms_session='))?.slice(12);sessions.delete(id);res.setHeader('Set-Cookie','cms_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,{ok:true});}
 if(req.method==='DELETE'&&pathname.startsWith('/api/admin/posts/')){await store.remove(pathname.slice('/api/admin/posts/'.length));return json(res,{ok:true});}
 if(req.method==='POST'&&pathname==='/api/admin/posts'){const {post,originalSlug}=JSON.parse((await body(req)).toString());return json(res,await store.save(post,originalSlug||null));}
 if(req.method==='POST'&&pathname==='/api/admin/media'){
 const bytes=await body(req,5*1024*1024);let ext='';
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';
 else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)ext='jpg';
 else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')ext='webp';
 if(!ext)throw Error('Choose a PNG, JPEG, or WebP image');const name=randomUUID()+'.'+ext;await mkdir(path.join(data,'media'),{recursive:true});await writeFile(path.join(data,'media',name),bytes);return json(res,{url:'/media/'+name});
 }
 }return json(res,{error:'Not found'},404);}
 if(!['GET','HEAD'].includes(req.method))return json(res,{error:'Method not allowed'},405);
 let file;
 if(pathname.startsWith('/media/')){if(!/^\/media\/[a-f0-9-]+\.(png|jpg|webp)$/.test(pathname))throw Error('Invalid media path');file=path.join(data,pathname.slice(1));}
 else {const route=pathname==='/'?'/index.html':pathname==='/admin'||pathname==='/admin/'||pathname==='/admin/posts'||pathname==='/blog'||pathname==='/blog/'||/^\/blog\/[a-z0-9-]+$/.test(pathname)?'/blog/index.html':pathname;file=path.resolve(root,'.'+route);if(!file.startsWith(root))return json(res,{error:'Forbidden'},403);}
 const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);
 }catch(e){if(e.code==='ENOENT')return json(res,{error:'Not found'},404);json(res,{error:e.message||'Request failed'},400);}
};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
const port=Number(process.env.PORT||4173);
http.createServer(createHandler({directory:process.env.CMS_DATA_DIR,port})).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}\nBlog: http://127.0.0.1:${port}/blog\nLocal CMS: http://127.0.0.1:${port}/admin`));
}
