// The only source for footer markup and social links. Builds render it into every page.
export const socialLinks = [
  {label: 'X', url: 'https://x.com/andilejaden', icon: 'x'},
  {label: 'Instagram', url: 'https://www.instagram.com/andilejaden/', icon: 'instagram'},
  {label: 'GitHub', url: 'https://github.com/xeroxzen', icon: 'github'},
  {label: 'LinkedIn', url: 'https://linkedin.com/in/andile-jaden-mbele/', icon: 'linkedin'},
  {label: 'Medium', url: 'https://medium.com/@andilembele', icon: 'medium'},
];
// A public Spotify playlist. Without JavaScript it is a plain link; /playlist.js swaps in the
// player only when clicked, so Spotify loads nothing for visitors who never press play.
export const playlist = {name: 'Let’s Build', id: '6ATKI9IMHGSWtNwGFufjaE'};
const PLAYLIST_ID = /^[A-Za-z0-9]{22}$/;

function renderPlaylist() {
  if (!PLAYLIST_ID.test(playlist.id)) throw Error('footer: playlist.id must be a 22-character Spotify playlist ID');
  return `<div class="playlist" data-playlist-id="${playlist.id}"><a class="playlist-link" href="https://open.spotify.com/playlist/${playlist.id}"><span class="playlist-play" aria-hidden="true"></span><span>Listen to <strong>${playlist.name}</strong>, the playlist I code to</span></a></div>`;
}

export function renderFooter() {
  return `<footer><div class="footer-start"><span>Andile Jaden Mbele</span>${renderPlaylist()}</div><nav class="social-links" aria-label="Social links">${socialLinks.map(({label,url,icon}) => `<a href="${url}"><img src="/assets/icons/${icon}.svg" alt="" width="16" height="16">${label} <span aria-hidden="true">↗</span></a>`).join('')}</nav></footer>`;
}
