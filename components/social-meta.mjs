import { requireEnv } from '../lib/env.mjs';
import { socialLinks } from './footer.mjs';

const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const NAME = 'Andile Jaden Mbele';
const HOME_DESCRIPTION = 'Software Engineer who ran a four-region AWS platform and builds internal systems that multiply engineering teams.';
export const SITE_IMAGE = { path: '/assets/andile-opengraph.jpg', width: 1200, height: 631 };

// "<" is escaped so a title can never close the script element early.
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;

function person(origin) {
  return { '@type': 'Person', name: NAME, url: origin + '/', jobTitle: 'Software Engineer', image: origin + '/assets/andile-mbele.jpg', sameAs: socialLinks.map((link) => link.url) };
}

/**
 * schema.org data: a Person on the homepage and a BlogPosting on each journal post page.
 */
function structuredData(origin, page, home) {
  if (page) {
    return jsonLd({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: page.title, description: page.description, datePublished: page.date, url: origin + page.path, mainEntityOfPage: origin + page.path, image: origin + page.image.path, author: person(origin) });
  }
  if (home) return jsonLd({ '@context': 'https://schema.org', ...person(origin) });
  return '';
}

/**
 * Canonical link, feed link, structured data, and Open Graph and Twitter tags for the public origin in SITE_URL.
 * The blog shell serves every /blog/?post=<slug> URL, so it omits og:url and the canonical link;
 * a fixed value would make scrapers like WhatsApp link shares to /blog/. The shell sets its canonical at runtime.
 * A journal post page passes `page` with its own title, description, path, and image.
 */
export function renderSocialMeta({ blog = false, page = null } = {}) {
  const origin = requireEnv('SITE_URL').replace(/\/$/, '');
  const home = !page && !blog;
  const title = page ? page.title : blog ? 'Writing · ' + NAME : NAME + ' · Software Engineer';
  const description = page ? page.description : blog ? 'Writing on software, infrastructure, and data.' : HOME_DESCRIPTION;
  const path = page ? page.path : blog ? null : '/';
  const image = origin + (page ? page.image.path : SITE_IMAGE.path);
  const size = page ? page.image : SITE_IMAGE;
  const imageAlt = page ? page.title + ' by ' + NAME : NAME + ' — Software Engineer. Backend, AI Agents, Data and Infrastructure.';
  return `${path ? `<link rel="canonical" href="${escape(origin + path)}">\n` : ''}<link rel="alternate" type="application/rss+xml" title="Writing · ${NAME}" href="${origin}/blog/feed.xml">
${structuredData(origin, page, home)}<meta property="og:type" content="${page ? 'article' : 'website'}">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
${path ? `<meta property="og:url" content="${escape(origin + path)}">\n` : ''}${page ? `<meta property="article:published_time" content="${escape(page.date)}">\n` : ''}<meta property="og:image" content="${image}">
<meta property="og:image:width" content="${size.width}">
<meta property="og:image:height" content="${size.height}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="${escape(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:creator" content="@andilejaden">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${escape(page ? imageAlt : NAME + ', Software Engineer')}">`;
}
