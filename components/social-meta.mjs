// Public origin is configurable when the site moves to Andile's domain.
const origin = (process.env.SITE_URL || 'https://andilejadenmbele.thabhelo-duve.chatgpt.site').replace(/\/$/, '');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export function renderSocialMeta({blog = false} = {}) {
  const title = blog ? 'Writing · Andile Jaden Mbele' : 'Andile Jaden Mbele · Systems Engineer';
  const description = blog ? 'Writing on software, infrastructure, and data.' : 'Principal Engineer. Backend, infrastructure, data & DevOps.';
  const image = origin + '/assets/andile-opengraph.png';
  return `<meta property="og:type" content="website">
<meta property="og:site_name" content="Andile Jaden Mbele">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${origin}${blog ? '/blog/' : '/'}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1730">
<meta property="og:image:height" content="909">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="Andile Jaden Mbele — Principal Engineer. Backend, Infrastructure, Data and DevOps.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:creator" content="@andilejaden">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="Andile Jaden Mbele, Principal Engineer">`;
}
