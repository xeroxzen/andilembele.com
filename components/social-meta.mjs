import { requireEnv } from '../lib/env.mjs';

const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

/**
 * Open Graph and Twitter tags for the public origin in SITE_URL.
 * The blog shell serves every /blog/?post=<slug> URL, so it omits og:url;
 * a fixed value would make scrapers like WhatsApp link shares to /blog/.
 * A journal post page passes `page` with its own title, description, path, and image.
 */
export function renderSocialMeta({ blog = false, page = null } = {}) {
  const origin = requireEnv('SITE_URL').replace(/\/$/, '');
  const title = page ? page.title : blog ? 'Writing · Andile Jaden Mbele' : 'Andile Jaden Mbele · Software Engineer';
  const description = page ? page.description : blog ? 'Writing on software, infrastructure, and data.' : 'Software Engineer who ran a four-region AWS platform and builds internal systems that multiply engineering teams.';
  const path = page ? page.path : blog ? null : '/';
  const image = origin + (page ? page.image.path : '/assets/andile-opengraph.png?v=2');
  const size = page ? page.image : { width: 1730, height: 909 };
  const imageAlt = page ? page.title + ' by Andile Jaden Mbele' : 'Andile Jaden Mbele — Software Engineer. Backend, AI Agents, Data and Infrastructure.';
  return `<meta property="og:type" content="${page ? 'article' : 'website'}">
<meta property="og:site_name" content="Andile Jaden Mbele">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
${path ? `<meta property="og:url" content="${escape(origin + path)}">\n` : ''}${page ? `<meta property="article:published_time" content="${escape(page.date)}">\n` : ''}<meta property="og:image" content="${image}">
<meta property="og:image:width" content="${size.width}">
<meta property="og:image:height" content="${size.height}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${escape(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:creator" content="@andilejaden">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${escape(page ? imageAlt : 'Andile Jaden Mbele, Software Engineer')}">`;
}
