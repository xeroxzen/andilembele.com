import assert from 'node:assert/strict';
import { postSummary, SLUG } from './post-page.mjs';

const MAX_FEED_ITEMS = 30;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const escapeXML = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function checkOrigin(origin) {
  assert.match(origin, /^https?:\/\/[^/]+$/, 'origin must be scheme and host with no trailing slash');
}

/**
 * robots.txt: everything public except the CMS, plus the sitemap location.
 */
export function renderRobots(origin) {
  checkOrigin(origin);
  return `User-agent: *\nDisallow: /admin/\nDisallow: /blog/admin/\n\nSitemap: ${origin}/sitemap.xml\n`;
}

/**
 * sitemap.xml: the homepage, the writing index, and every prerendered journal post.
 */
export function renderSitemap(origin, journal) {
  checkOrigin(origin);
  assert.ok(Array.isArray(journal), 'renderSitemap: journal must be an array');
  const entry = (path, lastmod) => `<url><loc>${escapeXML(origin + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  const posts = journal.map((post) => {
    assert.ok(SLUG.test(post.slug), 'renderSitemap: invalid slug ' + post.slug);
    assert.match(post.date, DATE, 'renderSitemap: invalid date for ' + post.slug);
    return entry('/blog/' + post.slug + '/', post.date);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[entry('/'), entry('/blog/'), ...posts].join('')}</urlset>\n`;
}

const pubDate = (date) => new Date(date + 'T12:00:00Z').toUTCString();

/**
 * RSS 2.0 feed of journal posts and Medium articles, newest first. Medium items link to Medium.
 */
export function renderFeed(origin, journal, medium) {
  checkOrigin(origin);
  assert.ok(Array.isArray(journal) && Array.isArray(medium), 'renderFeed: journal and medium must be arrays');
  const items = [
    ...journal.map((post) => ({ title: post.title, link: origin + '/blog/' + post.slug + '/', date: post.date, description: postSummary(post) })),
    ...medium.map((post) => ({ title: post.title, link: post.url, date: post.date, description: post.excerpt })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_FEED_ITEMS);
  const body = items.map((item) => {
    assert.match(item.date, DATE, 'renderFeed: invalid date for ' + item.title);
    assert.match(item.link, /^https:\/\/|^http:\/\/(127\.0\.0\.1|localhost)/, 'renderFeed: invalid link for ' + item.title);
    return `<item><title>${escapeXML(item.title)}</title><link>${escapeXML(item.link)}</link><guid isPermaLink="true">${escapeXML(item.link)}</guid><pubDate>${pubDate(item.date)}</pubDate>${item.description ? `<description>${escapeXML(item.description)}</description>` : ''}</item>`;
  }).join('');
  const updated = items.length ? `<lastBuildDate>${pubDate(items[0].date)}</lastBuildDate>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Writing · Andile Jaden Mbele</title><link>${origin}/blog/</link><description>Writing on software, infrastructure, and data.</description><language>en</language><atom:link href="${origin}/blog/feed.xml" rel="self" type="application/rss+xml"/>${updated}${body}</channel></rss>\n`;
}
