import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderFooter,playlist} from '../components/footer.mjs';
import {embedURL} from '../dist/playlist.js';

test('footer links to the playlist so it works without JavaScript',()=>{
 const footer=renderFooter();
 assert.ok(footer.includes(`href="https://open.spotify.com/playlist/${playlist.id}"`));
 assert.ok(footer.includes(`data-playlist-id="${playlist.id}"`));
 assert.ok(!footer.includes('<iframe'),'Spotify must not load until a visitor asks for it');
});

test('player only embeds well-formed Spotify playlist IDs',()=>{
 assert.equal(embedURL(playlist.id),`https://open.spotify.com/embed/playlist/${playlist.id}?theme=0`);
 assert.equal(embedURL('../../evil'),null);
 assert.equal(embedURL('abc'),null);
 assert.equal(embedURL(undefined),null);
});

test('every public page with the footer loads the player script',async()=>{
 for(const page of ['out/index.html','out/blog/index.html']){
  const html=await readFile(new URL('../'+page,import.meta.url),'utf8');
  assert.match(html,/<script type="module" src="\/playlist.js"><\/script>/,page);
 }
 await readFile(new URL('../out/playlist.js',import.meta.url));
});
