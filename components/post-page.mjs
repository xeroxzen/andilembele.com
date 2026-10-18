import assert from 'node:assert/strict';
import { renderSocialMeta } from './social-meta.mjs';
import { renderFooter } from './footer.mjs';
import { markdown, escapeHTML as e } from '../dist/blog/markdown.js';
import { dateLabel } from '../dist/blog/listing.js';

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SUMMARY_LENGTH = 200;
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

/**
 * Plain-text description for link previews: the excerpt, or the opening of the body.
 */
export function postSummary(post) {
  const excerpt = post.excerpt.trim();
  if (excerpt) return excerpt;
  const text = markdown(post.content).replace(/<\/?(a|strong|em|code|img)\b[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]).replace(/\s+/g, ' ').trim();
  if (text.length <= SUMMARY_LENGTH) return text;
  const cut = text.slice(0, SUMMARY_LENGTH);
  const space = cut.lastIndexOf(' ');
  return (space > 0 ? cut.slice(0, space) : cut) + '…';
}

/**
 * Static page for one published journal post at /blog/<slug>/, so crawlers that
 * skip JavaScript still see the article's title and description.
 */
export function renderPostPage(template, post) {
  assert.ok(SLUG.test(post.slug), 'renderPostPage: invalid slug ' + post.slug);
  assert.equal(post.status, 'published', 'renderPostPage: post must be published');
  const description = postSummary(post);
  const page = { title: post.title, description, path: '/blog/' + post.slug + '/', date: post.date };
  const content = `<section class="article"><a class="back-home" href="/blog">← All writing</a><p class="eyebrow">${e(dateLabel(post.date))}</p><h1>${e(post.title)}</h1>${post.excerpt ? `<p class="lead">${e(post.excerpt)}</p>` : ''}<div class="prose">${markdown(post.content)}</div></section>`;
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${e(post.title)} · Andile Jaden Mbele</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${e(description)}">`)
    .replace('{{footer}}', () => renderFooter())
    .replace('{{socialMeta}}', () => renderSocialMeta({ page }))
    .replace('{{content}}', () => content);
  assert.ok(!html.includes('{{'), 'renderPostPage: unreplaced template placeholder');
  return html;
}
