import {requireEnv} from '../lib/env.mjs';

/**
 * Open Graph and Twitter tags for the public origin in SITE_URL.
 */
export function renderSocialMeta({blog = false} = {}) {
  const origin = requireEnv('SITE_URL').replace(/\/$/, '');
  const title = blog ? 'Writing · Andile Jaden Mbele' : 'Andile Jaden Mbele · Systems Engineer';
  const description = blog ? 'Writing on software, infrastructure, and data.' : 'Principal Engineer operating a four-region AWS platform and building internal systems that multiply engineering teams.';
  const image = origin + '/assets/andile-opengraph.png';
  const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
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
