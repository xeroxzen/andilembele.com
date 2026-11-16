import assert from 'node:assert/strict';
import { loadContent } from '../lib/content.mjs';
import { renderMenus, renderPage } from './layout.mjs';
import { allPages, notFoundPage } from './pages.mjs';
import { ARTICLE_IMAGE } from './og-image.mjs';

// Renders every static page from content/. Builds call this and only write the results.

/**
 * Share-card file name for a page path: "/projects/echofind/" becomes "projects-echofind".
 */
export function cardName(path) {
  assert.match(path, /^\/([a-z0-9-]+\/)+$/, 'cardName: path must be a nested directory path');
  return path.slice(1, -1).replaceAll('/', '-');
}

/**
 * Output file for a page path, relative to the site root.
 */
export function outputFile(path) {
  if (path === '/') return 'index.html';
  if (path === '/404.html') return '404.html';
  assert.match(path, /^\/([a-z0-9-]+\/)+$/, 'outputFile: unexpected path ' + path);
  return path.slice(1) + 'index.html';
}

function previewPage(page) {
  if (page.path === '/' || page.noindex) return null;
  const image = page.card ? { path: `/assets/og/${cardName(page.path)}.jpg`, ...ARTICLE_IMAGE } : undefined;
  return { title: page.title, description: page.description, path: page.path, image, person: page.person };
}

/**
 * All pages as { path, file, html, card }. `posts` mixes journal and Medium posts; `prerendered` holds journal slugs with pages.
 */
export async function buildPages({ posts, prerendered }) {
  const content = await loadContent();
  const menus = renderMenus(content);
  const pages = [...allPages(content, { posts, prerendered }), notFoundPage()].map((page) => ({
    path: page.path,
    file: outputFile(page.path),
    card: page.card ? { ...page.card, name: cardName(page.path) } : null,
    html: renderPage({ ...page, page: previewPage(page), menus }),
  }));
  const files = new Set(pages.map((page) => page.file));
  assert.equal(files.size, pages.length, 'buildPages: two pages write the same file');
  return { content, menus, pages };
}
