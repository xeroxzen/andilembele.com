// The only source for footer markup and social links. Builds render it into every page.
export const socialLinks = [
  {label: 'X', url: 'https://x.com/andilejaden', icon: 'x'},
  {label: 'Instagram', url: 'https://www.instagram.com/andilejaden/', icon: 'instagram'},
  {label: 'GitHub', url: 'https://github.com/xeroxzen', icon: 'github'},
  {label: 'LinkedIn', url: 'https://linkedin.com/in/andile-jaden-mbele/', icon: 'linkedin'},
  {label: 'Medium', url: 'https://medium.com/@andilembele', icon: 'medium'},
];
export function renderFooter() {
  return `<footer><span>Andile Jaden Mbele</span><nav class="social-links" aria-label="Social links">${socialLinks.map(({label,url,icon}) => `<a href="${url}"><img src="/assets/icons/${icon}.svg" alt="" width="16" height="16">${label} <span aria-hidden="true">↗</span></a>`).join('')}</nav></footer>`;
}
