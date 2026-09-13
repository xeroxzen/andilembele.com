import {doc,runTransaction} from 'firebase/firestore';
export async function restorePosts(db,posts){
  await runTransaction(db,async tx=>{
   const refs=posts.map(p=>doc(db,'posts',p.slug));
   const snapshots=await Promise.all(refs.map(ref=>tx.get(ref)));
   if(snapshots.some(s=>s.exists()))throw Error('Restore stopped: a post with one of these slugs already exists. Nothing was overwritten.');
   posts.forEach((p,i)=>tx.set(refs[i],p));
  });
}
