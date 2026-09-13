import {restorePosts} from './restore.js';
import {parseBackup} from './backup.js';
import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,browserSessionPersistence,setPersistence} from 'firebase/auth';
import {getFirestore,collection,doc,getDocs,query,where,runTransaction,deleteDoc} from 'firebase/firestore';
/**
 * Firebase web values are injected by esbuild from .env at `npm run build:sites`.
 * They still ship in the public CMS bundle; restrict authorized domains in Firebase.
 */
const config={
 apiKey:process.env.FIREBASE_API_KEY,
 authDomain:process.env.FIREBASE_AUTH_DOMAIN,
 projectId:process.env.FIREBASE_PROJECT_ID,
 appId:process.env.FIREBASE_APP_ID,
 messagingSenderId:process.env.FIREBASE_MESSAGING_SENDER_ID,
};
if(!config.apiKey||!config.authDomain||!config.projectId||!config.appId)throw Error('Firebase web config was not injected at build time.');
const allowedEmails=String(process.env.CMS_ADMIN_EMAILS||'').split(',').map(email=>email.trim().toLowerCase()).filter(Boolean);
if(!allowedEmails.length)throw Error('CMS admin allowlist was not injected at build time.');
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
await setPersistence(auth,browserSessionPersistence);
await auth.authStateReady();
const allowed=()=>auth.currentUser?.emailVerified&&allowedEmails.includes(auth.currentUser.email?.toLowerCase())&&auth.currentUser.providerData.some(p=>p.providerId==='google.com');
export async function login(){
 const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
 await signInWithPopup(auth,provider);
 if(!allowed()){await signOut(auth);throw Error('This Google account does not have administrator access.');}
}
export async function logout(){for(const k of Object.keys(sessionStorage))if(k.startsWith('andile-editor'))sessionStorage.removeItem(k);await signOut(auth);}
export const recoveryKey=()=> 'andile-editor-recovery-'+(auth.currentUser?.uid||'anonymous');
export async function request(url,options={}){
 const method=options.method||'GET';
 if(url==='/api/posts')return (await getDocs(query(collection(db,'posts'),where('status','==','published')))).docs.map(d=>d.data());
 if(!allowed())throw Error('Sign in with an authorized Google account.');
 if(url==='/api/session')return {mode:'firebase',token:'',passwordProtected:true,email:auth.currentUser.email};
 if(url==='/api/logout'){await logout();return {ok:true};}
 if(url==='/api/admin/posts'&&method==='GET')return (await getDocs(collection(db,'posts'))).docs.map(d=>d.data());
 if(url==='/api/admin/restore'&&method==='POST'){
  const posts=parseBackup(options.body);
  await restorePosts(db,posts);return {count:posts.length};
 }
 if(url==='/api/admin/media')throw Error('Image uploads are not enabled yet. Text posts can be published now.');
 if(url.startsWith('/api/admin/posts/')&&method==='DELETE'){await deleteDoc(doc(db,'posts',decodeURIComponent(url.split('/').pop())));return {ok:true};}
 if(url==='/api/admin/posts'&&method==='POST'){
  const {post,originalSlug}=JSON.parse(options.body);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug))throw Error('Use a lowercase slug with hyphens.');
  await runTransaction(db,async tx=>{
   const target=doc(db,'posts',post.slug),existing=await tx.get(target);
   const original=originalSlug&&originalSlug!==post.slug?doc(db,'posts',originalSlug):null;
   const previous=original?await tx.get(original):existing;
   if(existing.exists()&&originalSlug!==post.slug)throw Error('That slug already exists.');
   if(originalSlug&&!previous.exists())throw Error('Original post no longer exists.');
   tx.set(target,post);if(original)tx.delete(original);
  });return post;
 }
 throw Error('Unsupported CMS operation.');
}
