import assert from 'node:assert/strict';
import { escapeHTML as e } from '../dist/blog/markdown.js';
import { galleryCard, pageIcon } from './blocks.mjs';

// Notion-style database: one set of items shown as a table, a gallery, a board grouped by a property, or a calendar.
// All views are rendered on the server; /site.js switches between them and filters by tag.
// Without JavaScript the default view shows every item and the controls stay hidden.

const MAX_ITEMS = 200;
const MAX_FILTERS = 60;
export const VIEWS = ['table', 'gallery', 'board', 'calendar'];
const VIEW_LABELS = { table: 'Table', gallery: 'Gallery', board: 'Board', calendar: 'Calendar' };
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MAX_MONTHS = 24;

/**
 * URL- and attribute-safe form of a tag: "OPA/Rego" becomes "opa-rego".
 */
export function tagSlug(tag) {
  const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  assert.ok(slug, `tagSlug: "${tag}" has no letters or digits`);
  return slug;
}

function titleCell(item) {
  const label = `${item.icon ? pageIcon(item.icon, item.cover, 'small') : ''}<span>${e(item.title)}</span>`;
  if (!item.href) return `<th scope="row" class="cell-title">${label}</th>`;
  const external = /^https:/.test(item.href);
  return `<th scope="row" class="cell-title"><a href="${e(item.href)}"${external ? ' rel="noopener"' : ''}>${label}</a></th>`;
}

function tableView(config, items) {
  const head = `<tr><th scope="col">${e(config.titleLabel)}</th>${config.columns.map((c) => `<th scope="col">${e(c.label)}</th>`).join('')}</tr>`;
  const rows = items.map((item) => `<tr ${itemAttrs(item)}>${titleCell(item)}${config.columns.map((c) => `<td>${item.cells[c.key] ?? ''}</td>`).join('')}</tr>`).join('');
  return `<div class="table-scroll"><table class="database-table"><caption class="visually-hidden">${e(config.label)}</caption><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}

const itemAttrs = (item) => `data-item data-tags="${e(item.tags.map(tagSlug).join(' '))}"`;

function galleryView(items) {
  return `<ul class="gallery">${items.map((item) => `<li ${itemAttrs(item)}>${galleryCard(item)}</li>`).join('')}</ul>`;
}

function boardView(config, items) {
  const columns = config.groups.map((group) => {
    const members = items.filter((item) => (item.group || config.emptyGroup) === group);
    const cards = members.map((item) => `<li ${itemAttrs(item)}>${galleryCard(item)}</li>`).join('');
    return `<section class="board-column" aria-label="${e(group)}"><h3 class="board-title">${e(group)} <span class="board-count">${members.length}</span></h3><ul class="board-cards">${cards}</ul></section>`;
  });
  return `<div class="board">${columns.join('')}</div>`;
}

function calendarGrid(month, items, today) {
  const [year, index] = month.split('-').map(Number);
  const offset = (new Date(Date.UTC(year, index - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, index, 0)).getUTCDate();
  const cells = WEEKDAYS.map((d) => `<span class="calendar-weekday">${d}</span>`);
  for (let i = 0; i < offset; i += 1) cells.push('<span></span>');
  for (let day = 1; day <= days; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const marks = items.filter((item) => item.date === date).map((item) => `<i class="calendar-mark mark-${e(item.mark ?? 'solid')}" data-mark data-tags="${e(item.tags.map(tagSlug).join(' '))}"></i>`).join('');
    cells.push(`<span class="calendar-day${date === today ? ' is-today' : ''}${marks ? ' has-marks' : ''}">${day}${marks ? `<span class="calendar-marks">${marks}</span>` : ''}</span>`);
  }
  return `<div class="calendar-grid" aria-hidden="true">${cells.join('')}</div>`;
}

function calendarItem(item) {
  const day = item.date.length === 10 ? String(Number(item.date.slice(8))) : '';
  const external = /^https:/.test(item.href ?? '');
  const title = item.href ? `<a href="${e(item.href)}"${external ? ' rel="noopener"' : ''}>${e(item.title)}${external ? ' <span aria-hidden="true">↗</span>' : ''}</a>` : e(item.title);
  return `<li ${itemAttrs(item)}><span class="calendar-date">${day ? `<span class="visually-hidden">${MONTH_NAMES[Number(item.date.slice(5, 7)) - 1]} </span>${day}` : '<span class="calendar-undated">Month</span>'}</span><div><p class="calendar-item-title">${title}</p><p class="calendar-summary">${e(item.summary)}</p><p class="calendar-props">${item.props}</p></div></li>`;
}

// Months newest first. Each has a small grid with a mark on every ship day, then the list that screen readers get.
function calendarView(config, items) {
  assert.ok(config.months.length <= MAX_MONTHS, 'calendarView: too many months');
  return config.months.map((month) => {
    assert.match(month, /^\d{4}-(0[1-9]|1[0-2])$/, 'calendarView: months are YYYY-MM');
    const members = items.filter((item) => item.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
    const [year, index] = month.split('-');
    const id = `${config.id}-${month}`;
    return `<section class="calendar-month${month === config.today.slice(0, 7) ? ' is-current' : ''}" aria-labelledby="${id}"><h3 class="calendar-title" id="${id}">${MONTH_NAMES[Number(index) - 1]} <span>${year}</span></h3>${calendarGrid(month, members, config.today)}<ol class="calendar-items">${members.map(calendarItem).join('')}</ol><p class="calendar-none">Nothing shipped this month.</p></section>`;
  }).join('');
}

function toolbar(config, filters, count) {
  const views = config.views.length > 1
    ? `<div class="view-switch js-only" role="group" aria-label="Layout">${config.views.map((view) => `<button type="button" data-view-button="${view}" aria-pressed="${view === config.defaultView}">${VIEW_LABELS[view]}</button>`).join('')}</div>`
    : '';
  const chips = filters.length
    ? `<div class="filter-chips js-only" role="group" aria-label="${e(config.filterLabel)}"><button type="button" data-filter="" aria-pressed="true">All</button>${filters.map((tag) => `<button type="button" data-filter="${e(tagSlug(tag))}" aria-pressed="false">${e(tag)}</button>`).join('')}</div>`
    : '';
  return `<div class="database-toolbar">${views}<p class="database-count" data-count data-noun="${e(config.noun[0])}" data-nouns="${e(config.noun[1])}" role="status">${count} ${e(count === 1 ? config.noun[0] : config.noun[1])}</p>${chips}</div>`;
}

/**
 * Render a database. Items: { title, href?, icon?, cover, summary, tags, group?, cells: {key: html}, props: html }.
 * Config: { id, label, titleLabel, columns: [{key,label}], views, defaultView, groups?, emptyGroup?, filters?, filterLabel?, noun: [one, many] }.
 * A calendar view also needs items[].date (YYYY-MM-DD or YYYY-MM), config.months (YYYY-MM, newest first) and config.today;
 * items[].mark ('solid' or 'ring') sets how the day is marked.
 * `stateKey` prefixes the URL parameters, so two databases on one page keep separate state.
 */
export function databaseView(config, items) {
  assert.match(config.id, /^[a-z-]+$/, 'databaseView: invalid id');
  assert.ok(!config.stateKey || /^[a-z]+-$/.test(config.stateKey), 'databaseView: stateKey is lowercase letters and a dash');
  assert.ok(items.length <= MAX_ITEMS, 'databaseView: too many items');
  assert.ok(config.views.every((view) => VIEWS.includes(view)), 'databaseView: unknown view');
  assert.ok(config.views.includes(config.defaultView), 'databaseView: default view must be one of the views');
  const filters = (config.filters ?? []).slice(0, MAX_FILTERS);
  const slugs = filters.map(tagSlug);
  assert.equal(new Set(slugs).size, slugs.length, 'databaseView: two filters share a slug');
  const render = { table: () => tableView(config, items), gallery: () => galleryView(items), board: () => boardView(config, items), calendar: () => `<div class="calendar">${calendarView(config, items)}</div>` };
  const views = config.views.map((view) => `<div class="database-view database-${view}" data-view="${view}"${view === config.defaultView ? '' : ' hidden'}>${render[view]()}</div>`).join('');
  const stateKey = config.stateKey ? ` data-state-key="${e(config.stateKey)}"` : '';
  return `<section class="database block reveal" data-database="${config.id}"${stateKey} aria-label="${e(config.label)}">${toolbar(config, filters, items.length)}${views}<p class="database-empty" data-empty hidden>Nothing matches this filter.</p></section>`;
}
