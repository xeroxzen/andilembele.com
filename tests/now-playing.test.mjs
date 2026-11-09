import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {shapeTrack,createClient,CACHE_MS} from '../services/now-playing/spotify.mjs';
import {describe} from '../dist/now-playing.js';

const track={type:'track',name:'Song',artists:[{name:'A'},{name:'B'}],external_urls:{spotify:'https://open.spotify.com/track/1'},album:{images:[{url:'https://i.scdn.co/image/640',width:640},{url:'https://i.scdn.co/image/300',width:300},{url:'https://i.scdn.co/image/64',width:64}]}};
const json=(status,body)=>({status,ok:status>=200&&status<300,json:async()=>body});

function fakeSpotify(routes){
 const calls=[];
 const fetch=async(url,init)=>{const path=new URL(url).pathname;calls.push(path);const route=routes[path];assert.ok(route,'unexpected '+path);return typeof route==='function'?route(init):route;};
 return {fetch,calls};
}
const token=json(200,{access_token:'t',expires_in:3600});

test('shapeTrack keeps public fields, picks ~300px art, and rejects non-tracks',()=>{
 assert.deepEqual(shapeTrack(track),{title:'Song',artists:'A, B',url:'https://open.spotify.com/track/1',image:'https://i.scdn.co/image/300'});
 assert.equal(shapeTrack({...track,type:'episode'}),null);
 assert.equal(shapeTrack(null),null);
 const odd=shapeTrack({...track,external_urls:{spotify:'javascript:alert(1)'},album:{images:[{url:'http://evil.example/x',width:64}]}});
 assert.equal(odd.url,null);
 assert.equal(odd.image,null);
});

test('client reports the playing track and caches it',async()=>{
 let clock=0;
 const {fetch,calls}=fakeSpotify({'/api/token':token,'/v1/me/player/currently-playing':json(200,{is_playing:true,item:track})});
 const client=createClient({clientId:'id',clientSecret:'secret',refreshToken:'r',fetch,now:()=>clock});
 assert.deepEqual(await client.nowPlaying(),{playing:true,track:shapeTrack(track)});
 await client.nowPlaying();
 assert.equal(calls.length,2,'second call within the cache window hits nothing');
 clock+=CACHE_MS;
 await client.nowPlaying();
 assert.deepEqual(calls.slice(2),['/v1/me/player/currently-playing'],'token is reused until near expiry');
});

test('client falls back to the last played track when nothing is playing',async()=>{
 const {fetch}=fakeSpotify({'/api/token':token,'/v1/me/player/currently-playing':json(204,null),'/v1/me/player/recently-played':json(200,{items:[{track,played_at:'2026-11-09T10:00:00Z'}]})});
 const client=createClient({clientId:'id',clientSecret:'secret',refreshToken:'r',fetch});
 assert.deepEqual(await client.nowPlaying(),{playing:false,track:shapeTrack(track),playedAt:'2026-11-09T10:00:00Z'});
});

test('client serves the last good answer when Spotify fails, and throws with none',async()=>{
 let clock=0,fail=false;
 const {fetch}=fakeSpotify({'/api/token':token,'/v1/me/player/currently-playing':()=>fail?json(429,{}):json(200,{is_playing:true,item:track})});
 const client=createClient({clientId:'id',clientSecret:'secret',refreshToken:'r',fetch,now:()=>clock});
 const first=await client.nowPlaying();
 fail=true;clock+=CACHE_MS;
 assert.deepEqual(await client.nowPlaying(),first);
 const fresh=createClient({clientId:'id',clientSecret:'secret',refreshToken:'r',fetch});
 await assert.rejects(fresh.nowPlaying(),/HTTP 429/);
});

test('concurrent requests share one Spotify round trip',async()=>{
 const {fetch,calls}=fakeSpotify({'/api/token':token,'/v1/me/player/currently-playing':json(200,{is_playing:true,item:track})});
 const client=createClient({clientId:'id',clientSecret:'secret',refreshToken:'r',fetch});
 await Promise.all([client.nowPlaying(),client.nowPlaying(),client.nowPlaying()]);
 assert.equal(calls.length,2);
});

test('widget describes playing and last-played tracks and ignores untrusted links',()=>{
 assert.equal(describe(null),null);
 assert.equal(describe({playing:false,track:null}),null);
 const now=describe({playing:true,track:shapeTrack(track)});
 assert.equal(now.label,'Listening now on Spotify');
 assert.equal(now.url,'https://open.spotify.com/track/1');
 assert.equal(describe({playing:false,track:shapeTrack(track)}).label,'Last played on Spotify');
 const odd=describe({playing:true,track:{title:'x',url:'javascript:alert(1)',image:'https://evil.example/a.jpg'}});
 assert.equal(odd.url,null);
 assert.equal(odd.image,null);
});

test('home page ships the widget and the public build includes its script',async()=>{
 const home=await readFile(new URL('../out/index.html',import.meta.url),'utf8');
 assert.match(home,/<div class="now-playing" id="now-playing" hidden><\/div>/);
 assert.match(home,/<script type="module" src="\/now-playing.js"><\/script>/);
 await readFile(new URL('../out/now-playing.js',import.meta.url));
});
