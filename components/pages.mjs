import assert from 'node:assert/strict';
import { escapeHTML as e, markdown } from '../dist/blog/markdown.js';
import { dateLabel } from '../dist/blog/listing.js';
import { STATUSES, DOMAINS } from '../lib/content.mjs';
import { block, sectionHeading, callout, divider, pill, statusPill, domainPill, tagPills, toneOf, pageIcon, illustration, pageHeader, listView, gallery } from './blocks.mjs';
import { databaseView } from './database.mjs';
import { socialLinks } from './footer.mjs';
import { designPage } from './design.mjs';

// One function per page. Each returns { path, title, description, current, main, card } and never touches the file system.

const NAME = 'Andile Jaden Mbele';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LATEST_POSTS = 4;
const LOG_MONTHS = 12;

export function monthLabel(value) {
  const [year, month] = value.split('-');
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
}

export function periodLabel({ start, end }) {
  if (!start) return 'Current';
  return `${monthLabel(start)} – ${end ? monthLabel(end) : 'Now'}`;
}

function portrait(size) {
  return `<picture><source type="image/webp" srcset="/assets/andile-mbele.webp"><img class="portrait" src="/assets/andile-mbele.jpg" width="${size}" height="${size}" alt="${NAME}"></picture>`;
}

/**
 * Newest posts across the journal and Medium. Journal posts link to their prerendered page when one exists.
 */
function postHref(post, prerendered) {
  if (post.source !== 'Medium') return prerendered.has(post.slug) ? `/blog/${post.slug}/` : `/blog/?post=${encodeURIComponent(post.slug)}`;
  assert.match(post.url, /^https:\/\/medium\.com\//, 'postHref: Medium posts must link to medium.com');
  return post.url;
}

export function latestWriting(posts, prerendered) {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, LATEST_POSTS).map((post) => {
    const medium = post.source === 'Medium';
    return { title: post.title, href: postHref(post, prerendered), meta: `${medium ? 'Medium' : 'Journal'} · ${dateLabel(post.date)}`, external: medium };
  });
}

/**
 * Months from `today` back to the oldest dated entry, newest first, at most LOG_MONTHS.
 */
export function logMonths(today, dates) {
  const [year, month] = today.split('-').map(Number);
  const oldest = dates.reduce((min, date) => (date.slice(0, 7) < min ? date.slice(0, 7) : min), today.slice(0, 7));
  const months = [];
  for (let i = 0; i < LOG_MONTHS; i += 1) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (key < oldest) break;
    months.push(key);
  }
  return months;
}

function shippedThisYear(shipped, today) {
  return shipped.filter((s) => s.date.slice(0, 4) === today.slice(0, 4)).length;
}

// Things shipped and things written, as one calendar. Writing comes from the posts, so it never goes stale.
function shippingLog({ shipped }, { posts, prerendered, today }) {
  const months = logMonths(today, shipped.map((s) => s.date));
  const inWindow = (date) => months.includes(date.slice(0, 7));
  const work = shipped.filter((s) => inWindow(s.date)).map((s) => ({ title: s.title, href: s.href, date: s.date, cover: 'green', mark: 'solid', summary: s.summary, tags: ['Software', s.kind, s.domain], props: pill(s.kind, toneOf(s.kind)) + domainPill(s.domain), cells: { date: e(s.date.length === 10 ? dateLabel(s.date) : monthLabel(s.date)), kind: pill(s.kind, toneOf(s.kind)), domain: domainPill(s.domain), summary: `<span class="cell-wrap">${e(s.summary)}</span>` } }));
  const writing = posts.filter((post) => inWindow(post.date)).map((post) => {
    const source = post.source === 'Medium' ? 'Medium' : 'Journal';
    return { title: post.title, href: postHref(post, prerendered), date: post.date, cover: 'pink', mark: 'ring', summary: post.excerpt || `On ${source}.`, tags: ['Writing'], props: pill('Writing', toneOf('Writing')) + pill(source), cells: { date: e(dateLabel(post.date)), kind: pill('Writing', toneOf('Writing')), domain: pill(source), summary: `<span class="cell-wrap">${e(post.excerpt || '')}</span>` } };
  });
  const items = [...work, ...writing].sort((a, b) => b.date.localeCompare(a.date));
  const domains = DOMAINS.filter((d) => work.some((item) => item.tags.includes(d)));
  const config = {
    id: 'log', stateKey: 'log-', label: 'Shipping log', titleLabel: 'What', noun: ['entry', 'entries'],
    columns: [{ key: 'date', label: 'Date' }, { key: 'kind', label: 'Type' }, { key: 'domain', label: 'Area' }, { key: 'summary', label: 'Notes' }],
    views: ['calendar', 'table'], defaultView: 'calendar', months, today,
    filters: ['Software', 'Writing', ...domains], filterLabel: 'Filter the shipping log',
  };
  const lead = `<p class="section-lead">${shippedThisYear(shipped, today)} projects and releases in ${today.slice(0, 4)}, plus the writing in between. Filled dots are software, rings are writing.</p>`;
  return block(sectionHeading('Shipping log', { id: 'shipped' }) + lead, { className: 'section', reveal: false }) + databaseView(config, items);
}

function projectCard(p) {
  return { title: p.title, href: `/projects/${p.slug}/`, icon: p.icon, cover: p.cover, summary: p.summary, tags: [p.domain, ...p.stack], group: p.status, props: statusPill(p.status) + domainPill(p.domain), cells: { status: statusPill(p.status), domain: domainPill(p.domain), stack: tagPills(p.stack), role: e(p.role ?? ''), year: p.year ? String(p.year) : '' } };
}

function hero(site) {
  // At most one word in a headline is set in the serif italic.
  const marked = new Set(site.highlight.map((w) => w.toLowerCase()));
  const words = site.positioning.split(' ').map((word, i) => {
    const mark = marked.has(word.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ''));
    return `<span class="word w${Math.min(i + 1, 16)}">${mark ? `<em class="headline-em">${e(word)}</em>` : e(word)}</span>`;
  }).join(' ');
  const person = `<div class="hero-person">${portrait(56)}<div><p class="hero-name">${e(site.name)}</p><a class="status" href="#open-to"><span class="status-dot" aria-hidden="true"></span>${e(site.status)}</a></div></div>`;
  const title = `<h1 class="display" id="hero-title" aria-label="${e(site.positioning)}"><span aria-hidden="true">${words}</span></h1>`;
  const text = `<div class="hero-text"><p class="lead">${e(site.summary)}</p><p class="actions"><a class="button button-primary" href="/projects/">View work</a><a class="button" href="/contact/">Get in touch</a></p><p class="hero-hint js-only">Press <kbd data-mod-key>⌘</kbd><kbd>K</kbd> to jump anywhere, or type <kbd>/</kbd></p></div>`;
  return `<section class="hero" aria-labelledby="hero-title">${person}${title}${text}${illustration('hero', { className: 'illustration-hero' })}</section>`;
}

// "40B+" counts up from 0 to 40 and keeps its suffix; values without a leading number stay still.
function countAttrs(value) {
  const match = value.match(/^(\d{1,6})(\D*)$/);
  return match ? ` data-count-to="${match[1]}" data-suffix="${e(match[2])}"` : '';
}

export function openToBlock(site, { id = 'open-to', heading = 'Roles I am open to', more = { href: '/contact/', label: 'Get in touch' } } = {}) {
  const cards = site.openTo.map((r, i) => `<li class="role-card"><span class="role-index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3>${e(r.title)}</h3><p class="role-focus">${e(r.focus)}</p><p class="role-evidence">${e(r.evidence)}</p></li>`).join('');
  return block(sectionHeading(heading, { id, more }) + `<ul class="roles">${cards}</ul>`, { className: 'section' });
}

export function homePage({ site, projects, shipped }, { posts, prerendered, today }) {
  const featured = projects.filter((p) => p.featured);
  assert.ok(featured.length >= 3 && featured.length <= 4, 'homePage: feature three or four projects');
  const shippedCount = { value: String(shippedThisYear(shipped, today)), label: `projects and releases in ${today.slice(0, 4)}` };
  const proofItems = site.proof.length < 4 ? [site.proof[0], shippedCount, ...site.proof.slice(1)] : site.proof;
  const proof = `<dl class="proof">${proofItems.map((item) => `<div><dt>${e(item.label)}</dt><dd${countAttrs(item.value)}>${e(item.value)}</dd></div>`).join('')}</dl>`;
  const principles = `<ol class="principles">${site.principles.map((p, i) => `<li class="principle"><span class="principle-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3>${e(p.title)}</h3><p>${e(p.body)}</p>${p.source ? `<p class="principle-source">From <cite>${e(p.source)}</cite></p>` : ''}</li>`).join('')}</ol>`;
  const main = hero(site)
    + block(proof, { className: 'proof-block', label: 'Highlights' })
    + openToBlock(site)
    + block(sectionHeading('Selected work', { id: 'work', more: { href: '/projects/', label: 'All projects' } }) + gallery(featured.map(projectCard)), { className: 'section' })
    + block(sectionHeading('How I think', { id: 'principles', more: { href: '/about/#bookshelf', label: 'The bookshelf' } }) + principles, { className: 'section' })
    + block(sectionHeading('Latest writing', { id: 'writing', more: { href: '/blog/', label: 'All writing' } }) + listView(latestWriting(posts, prerendered)), { className: 'section' });
  return { path: '/', title: `${NAME} · Software Engineer`, description: site.summary, current: '', main, mainClass: 'page-home', card: null, person: true };
}

export function projectsPage(content, writing) {
  const { projects } = content;
  const used = new Set(projects.flatMap((p) => p.stack));
  const domains = DOMAINS.filter((d) => projects.some((p) => p.domain === d));
  const groups = [...STATUSES.filter((s) => projects.some((p) => p.status === s)), 'No status'];
  const config = {
    id: 'projects', label: 'Projects', titleLabel: 'Name', noun: ['project', 'projects'],
    columns: [{ key: 'status', label: 'Status' }, { key: 'domain', label: 'Domain' }, { key: 'stack', label: 'Stack' }, { key: 'role', label: 'Role' }, { key: 'year', label: 'Year' }],
    views: ['table', 'gallery', 'board'], defaultView: 'table', groups, emptyGroup: 'No status',
    filters: [...domains, ...[...used].sort((a, b) => a.localeCompare(b))], filterLabel: 'Filter by domain or stack',
  };
  const main = pageHeader({ title: 'Projects', lead: 'Systems I have built and shipped: security tooling, data platforms, and AI products. Open one for the full write-up.', art: 'projects' }) + databaseView(config, projects.map(projectCard)) + shippingLog(content, writing);
  return { path: '/projects/', title: `Projects · ${NAME}`, description: 'Security, data, and AI systems built by Andile Jaden Mbele, as a filterable database.', current: '/projects/', main, card: { eyebrow: 'Projects', title: 'Security, data and AI systems' } };
}

function property(label, value) {
  return `<div class="property"><dt>${e(label)}</dt><dd>${value || '<span class="empty">Empty</span>'}</dd></div>`;
}

function projectLinks(links) {
  const labels = { live: 'Website', repo: 'Source', writeup: 'Write-up', caseStudy: 'Case study' };
  return Object.entries(labels).filter(([key]) => links[key]).map(([key, label]) => {
    const external = /^https:/.test(links[key]);
    return `<a href="${e(links[key])}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}${external ? ' <span aria-hidden="true">↗</span>' : ''}</a>`;
  }).join('');
}

// The Markdown renderer starts "##" at <h3> for posts; on a project page the sections sit directly under the <h1>.
export function promoteHeadings(html) {
  return html.replace(/<(\/?)h([3-6])>/g, (_, slash, level) => `<${slash}h${Number(level) - 1}>`);
}

function projectBody(p) {
  const caseStudy = p.links.caseStudy ? callout({ title: 'Full case study', tone: 'tip', body: `<p>The complete write-up, with architecture and results, is in my writing: <a href="${e(p.links.caseStudy)}">read the ${e(p.title)} case study</a>.</p>` }) : '';
  if (!p.body && !caseStudy) return callout({ title: 'Write-up in progress', body: '<p>The detailed case study for this project is still being written. The summary and properties above are current.</p>' });
  return `${p.body ? `<div class="prose" data-copy-code>${promoteHeadings(markdown(p.body))}</div>` : ''}${caseStudy}`;
}

export function projectPage({ projects }, index) {
  const p = projects[index];
  assert.ok(p, 'projectPage: no project at index ' + index);
  const properties = `<dl class="properties">${property('Status', statusPill(p.status))}${property('Domain', domainPill(p.domain))}${property('Stack', tagPills(p.stack))}${property('Role', e(p.role ?? ''))}${property('Year', p.year ? String(p.year) : '')}${property('Links', projectLinks(p.links))}</dl>`;
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const pager = `<nav class="pager" aria-label="More projects"><a href="/projects/${previous.slug}/"><span>Previous</span>${e(previous.title)}</a><a href="/projects/${next.slug}/"><span>Next</span>${e(next.title)}</a></nav>`;
  const main = `<article class="notion-page"><div class="page-cover cover-${e(p.cover)}" aria-hidden="true"></div><div class="page-body">${pageIcon(p.icon, p.cover, 'large')}<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/projects/">Projects</a><span aria-hidden="true">/</span><span aria-current="page">${e(p.title)}</span></nav><h1 class="page-title">${e(p.title)}</h1>${properties}<p class="lead">${e(p.summary)}</p>${divider()}${projectBody(p)}${pager}</div></article>`;
  return { path: `/projects/${p.slug}/`, title: `${p.title} · ${NAME}`, description: p.summary, current: '/projects/', main, mainClass: 'page-wide', card: { eyebrow: `Project · ${p.domain}`, title: p.title } };
}

function nowSection(title, items) {
  if (!items.length) return '';
  const rows = items.map((item) => `<li><p class="now-title">${item.url ? `<a href="${e(item.url)}" target="_blank" rel="noopener">${e(item.title)} <span aria-hidden="true">↗</span></a>` : e(item.title)}</p>${item.note ? `<p class="now-note">${e(item.note)}</p>` : ''}</li>`).join('');
  return block(`<h2>${e(title)}</h2><ul class="now-list">${rows}</ul>`, { className: 'section-tight' });
}

export function nowPage({ now }) {
  const listening = block('<h2>Listening</h2><div class="now-playing" id="now-playing" hidden></div><p class="now-note now-playing-fallback">The playlist I code to is in the footer.</p>', { className: 'section-tight' });
  const main = pageHeader({ title: 'Now', eyebrow: `Updated ${e(dateLabel(now.updated))}`, lead: 'What I am building, reading, and learning at the moment.', art: 'now' })
    + nowSection('Building', now.building) + nowSection('Reading', now.reading) + nowSection('Learning', now.learning) + listening;
  return { path: '/now/', title: `Now · ${NAME}`, description: 'What Andile Jaden Mbele is building, reading, and learning right now.', current: '/now/', main, card: { eyebrow: 'Now', title: 'What I am building, reading and learning' } };
}

function timelineDatabase(timeline) {
  const items = timeline.map((r) => ({ title: r.org, href: r.url, summary: r.summary, cover: 'gray', tags: [r.kind], group: r.kind, props: domainPill(r.kind), cells: { role: e(r.role), kind: domainPill(r.kind), period: e(periodLabel(r)), summary: `<span class="cell-wrap">${e(r.summary)}</span>` } }));
  const config = { id: 'timeline', label: 'Career timeline', titleLabel: 'Organisation', noun: ['role', 'roles'], columns: [{ key: 'role', label: 'Role' }, { key: 'kind', label: 'Type' }, { key: 'period', label: 'Period' }, { key: 'summary', label: 'What I did' }], views: ['table', 'board'], defaultView: 'table', groups: ['Work', 'Venture', 'Community'], emptyGroup: 'Work' };
  return databaseView(config, items);
}

function bookshelf(library) {
  const sorted = [...library].sort((a, b) => a.kind.localeCompare(b.kind) || a.year - b.year);
  const items = sorted.map((b) => ({ title: b.title, cover: toneOf(b.topic), summary: `${b.author}, ${b.year}`, tags: [b.kind, b.topic], group: b.kind, props: pill(b.kind, toneOf(b.kind)) + pill(b.topic, toneOf(b.topic)), cells: { author: e(b.author), year: String(b.year), kind: pill(b.kind, toneOf(b.kind)), topic: pill(b.topic, toneOf(b.topic)) } }));
  const topics = [...new Set(sorted.map((b) => b.topic))].sort((a, b) => a.localeCompare(b));
  const config = { id: 'bookshelf', stateKey: 'shelf-', label: 'Bookshelf', titleLabel: 'Title', noun: ['title', 'titles'], columns: [{ key: 'author', label: 'Author' }, { key: 'year', label: 'Year' }, { key: 'kind', label: 'Type' }, { key: 'topic', label: 'Topic' }], views: ['table', 'gallery', 'board'], defaultView: 'table', groups: ['Book', 'Paper'], emptyGroup: 'Book', filters: ['Book', 'Paper', ...topics], filterLabel: 'Filter by type or topic' };
  return databaseView(config, items);
}

function talkGallery(talks) {
  return `<ul class="talks">${talks.map((t) => `<li><a class="talk" href="${e(t.url)}" target="_blank" rel="noopener"><picture><source type="image/webp" srcset="${t.image}.webp"><img src="${t.image}.jpg" alt="${e(t.alt)}" width="${t.width}" height="${t.height}" loading="lazy"></picture><span class="talk-title">${e(t.title)}</span><span class="talk-meta">${e(t.event)} · ${t.year}</span></a></li>`).join('')}</ul>`;
}

export function aboutPage({ site, timeline, talks, library }) {
  const intro = `<div class="about-intro">${portrait(96)}<div>${site.about.map((p) => `<p>${e(p)}</p>`).join('')}</div></div>`;
  const main = pageHeader({ title: 'About', lead: site.summary, art: 'about' }) + block(intro)
    + block(sectionHeading('Timeline', { id: 'timeline' }), { className: 'section-tight', reveal: false }) + timelineDatabase(timeline)
    + block(sectionHeading('Bookshelf', { id: 'bookshelf' }) + '<p class="section-lead">The books and papers most of my engineering judgement comes from.</p>', { className: 'section', reveal: false }) + bookshelf(library)
    + block(sectionHeading('Talks', { id: 'talks' }) + talkGallery(talks), { className: 'section' });
  return { path: '/about/', title: `About · ${NAME}`, description: site.summary, current: '/about/', main, mainClass: 'page-wide', card: { eyebrow: 'About', title: NAME }, person: true };
}

function resumeRoles(roles) {
  return roles.map((r) => `<article class="resume-role"><header><h3>${r.url ? `<a href="${e(r.url)}" target="_blank" rel="noopener">${e(r.org)}</a>` : e(r.org)}</h3><p class="resume-period">${e(periodLabel(r))}</p></header><p class="resume-title">${e(r.role)}${r.location ? ` · ${e(r.location)}` : ''}</p><p>${e(r.summary)}</p></article>`).join('');
}

export function resumePage({ site, timeline, talks }) {
  const download = `<p class="actions"><a class="button button-primary" href="${e(site.resumePdf)}" download>Download PDF</a><button class="button js-only" type="button" data-print>Print</button></p>`;
  const kinds = [['Experience', 'Work'], ['Ventures', 'Venture'], ['Community', 'Community']];
  const sections = kinds.map(([title, kind]) => block(`<h2>${title}</h2>${resumeRoles(timeline.filter((r) => r.kind === kind))}`, { className: 'resume-section' })).join('');
  const skills = block(`<h2>Skills</h2><dl class="resume-skills">${site.skills.map((s) => `<div><dt>${e(s.group)}</dt><dd>${s.items.map(e).join(', ')}</dd></div>`).join('')}</dl>`, { className: 'resume-section' });
  const speaking = block(`<h2>Talks</h2><ul class="resume-list">${talks.map((t) => `<li><span>${e(t.title)}</span> <span class="resume-period">${e(t.event)}, ${t.year}</span></li>`).join('')}</ul>`, { className: 'resume-section' });
  const awards = block(`<h2>Awards</h2><ul class="resume-list">${site.awards.map((a) => `<li><span>${e(a.title)}</span> <span class="resume-period">${a.year}</span></li>`).join('')}</ul>`, { className: 'resume-section' });
  const main = `<div class="resume">${pageHeader({ title: NAME, eyebrow: e(site.role), lead: site.summary })}${download}<p class="resume-status"><span class="status-dot" aria-hidden="true"></span>${e(site.status)}</p><p class="resume-contact"><a href="mailto:${e(site.email)}">${e(site.email)}</a> · <a href="/">andilembele.com</a></p>${sections}${skills}${speaking}${awards}</div>`;
  return { path: '/resume/', title: `Resume · ${NAME}`, description: `Résumé of ${NAME}: ${site.summary}`, current: '/resume/', main, card: { eyebrow: 'Resume', title: NAME } };
}

export function contactPage({ site }) {
  const email = `<p class="contact-email"><a href="mailto:${e(site.email)}">${e(site.email)}</a><button class="button js-only" type="button" data-copy-text="${e(site.email)}">Copy</button></p>`;
  const elsewhere = `<ul class="contact-links">${socialLinks.map((l) => `<li><a href="${e(l.url)}" target="_blank" rel="noopener">${e(l.label)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>`;
  const main = pageHeader({ title: 'Get in touch', lead: site.availability, art: 'contact' }) + block(email) + openToBlock(site, { id: 'roles', heading: 'What I am looking for', more: null }) + block(callout({ title: 'What helps', body: '<p>A line on what you are building, where you are stuck, and your timeline.</p>' })) + block(`<h2>Elsewhere</h2>${elsewhere}`, { className: 'section-tight' });
  return { path: '/contact/', title: `Contact · ${NAME}`, description: site.availability, current: '/contact/', main, card: { eyebrow: 'Contact', title: 'Get in touch' } };
}

export function notFoundPage() {
  const main = pageHeader({ title: 'Page not found', lead: 'That page does not exist, or it moved.' }) + `<p class="actions"><a class="button button-primary" href="/">Home</a><a class="button" href="/projects/">Projects</a><a class="button" href="/blog/">Writing</a></p>`;
  return { path: '/404.html', title: `Page not found · ${NAME}`, description: 'Page not found.', current: '', main, card: null, noindex: true };
}

/**
 * Every static page, in sitemap order. `posts` are journal and Medium posts; `prerendered` holds journal slugs with pages.
 */
export function allPages(content, { posts, prerendered, today = new Date().toISOString().slice(0, 10) }) {
  assert.ok(prerendered instanceof Set, 'allPages: prerendered must be a Set');
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/, 'allPages: today is YYYY-MM-DD');
  return [
    homePage(content, { posts, prerendered, today }),
    projectsPage(content, { posts, prerendered, today }),
    ...content.projects.map((_, i) => projectPage(content, i)),
    nowPage(content),
    aboutPage(content),
    resumePage(content),
    contactPage(content),
    designPage(),
  ];
}

