// Database views: switch between table, gallery, board, and calendar, and filter by tag. State lives in the URL
// (?view=board&tag=rust, or ?log-tag=security for a database with a state key) so a filtered view can be shared.

const MAX_ITEMS = 600;

/**
 * View and tag from a query string, keeping only values the database offers.
 */
export function readState(search, views, filters, prefix = '') {
  const params = new URLSearchParams(search);
  const view = params.get(prefix + 'view');
  const tag = params.get(prefix + 'tag');
  return { view: views.includes(view) ? view : null, tag: filters.includes(tag) ? tag : '' };
}

export function itemMatches(tags, tag) {
  return !tag || tags.split(' ').includes(tag);
}

/**
 * Query string after a change, leaving unrelated parameters alone and omitting defaults.
 */
export function writeState(search, { view, tag }, defaultView, prefix = '') {
  const params = new URLSearchParams(search);
  if (view && view !== defaultView) params.set(prefix + 'view', view);
  else params.delete(prefix + 'view');
  if (tag) params.set(prefix + 'tag', tag);
  else params.delete(prefix + 'tag');
  const query = params.toString();
  return query ? '?' + query : '';
}

function countLabel(count, root) {
  const counter = root.querySelector('[data-count]');
  return `${count} ${count === 1 ? counter.dataset.noun : counter.dataset.nouns}`;
}

export function initDatabase(root) {
  const viewButtons = [...root.querySelectorAll('[data-view-button]')];
  const filterButtons = [...root.querySelectorAll('[data-filter]')];
  const panels = [...root.querySelectorAll('[data-view]')];
  const items = [...root.querySelectorAll('[data-item]')].slice(0, MAX_ITEMS);
  const views = panels.map((panel) => panel.dataset.view);
  const defaultView = panels.find((panel) => !panel.hidden)?.dataset.view ?? views[0];
  const marks = [...root.querySelectorAll('[data-mark]')].slice(0, MAX_ITEMS);
  const filters = filterButtons.map((button) => button.dataset.filter).filter(Boolean);
  const prefix = root.dataset.stateKey ?? '';
  const state = readState(location.search, views, filters, prefix);
  state.view ??= defaultView;

  const render = () => {
    for (const panel of panels) panel.hidden = panel.dataset.view !== state.view;
    for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.viewButton === state.view));
    for (const button of filterButtons) button.setAttribute('aria-pressed', String(button.dataset.filter === state.tag));
    for (const item of items) item.hidden = !itemMatches(item.dataset.tags ?? '', state.tag);
    for (const mark of marks) mark.hidden = !itemMatches(mark.dataset.tags ?? '', state.tag);
    for (const column of root.querySelectorAll('.board-column')) {
      const count = column.querySelectorAll('[data-item]:not([hidden])').length;
      column.querySelector('.board-count').textContent = String(count);
    }
    const panel = panels.find((p) => p.dataset.view === state.view);
    const shown = panel.querySelectorAll('[data-item]:not([hidden])').length;
    root.querySelector('[data-count]').textContent = countLabel(shown, root);
    root.querySelector('[data-empty]').hidden = shown > 0;
  };

  const commit = () => {
    render();
    history.replaceState(history.state, '', location.pathname + writeState(location.search, state, defaultView, prefix) + location.hash);
  };

  for (const button of viewButtons) button.addEventListener('click', () => { state.view = button.dataset.viewButton; commit(); });
  for (const button of filterButtons) button.addEventListener('click', () => { state.tag = button.dataset.filter; commit(); });
  render();
}
