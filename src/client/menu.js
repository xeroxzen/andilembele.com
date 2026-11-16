// Command menus: the ⌘K palette and the "/" quick jump. Both are <dialog> elements rendered by components/layout.mjs;
// a modal dialog keeps focus inside, closes on Escape, and returns focus to where it was.

const MAX_OPTIONS = 200;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * True when every word of the query appears in the text, ignoring case.
 */
export function matches(text, query) {
  assert(typeof text === 'string' && typeof query === 'string', 'matches: text and query must be strings');
  const haystack = text.toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
}

/**
 * Next highlighted row when moving by `delta`, wrapping at both ends. -1 means nothing is highlighted.
 */
export function step(current, count, delta) {
  assert(Number.isInteger(current) && Number.isInteger(count) && count >= 0, 'step: integer positions required');
  if (count === 0) return -1;
  if (current < 0) return delta > 0 ? 0 : count - 1;
  return (((current + delta) % count) + count) % count;
}

export function isTypingTarget(target) {
  if (!target) return false;
  return target.isContentEditable === true || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName ?? '');
}

/**
 * Which menu a keydown should open: 'palette' for ⌘K or Ctrl+K, 'slash' for a bare "/" outside text fields.
 */
export function shortcutFor(event) {
  const key = (event.key ?? '').toLowerCase();
  if (key === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) return 'palette';
  if (key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) return 'slash';
  return null;
}

/**
 * Wire one menu dialog. `onAction(action, value)` runs the chosen option after the dialog closes.
 */
export function createMenu(dialog, onAction) {
  const input = dialog.querySelector('input');
  const options = [...dialog.querySelectorAll('[role="option"]')].slice(0, MAX_OPTIONS);
  const groups = [...dialog.querySelectorAll('[role="group"]')];
  const empty = dialog.querySelector('.menu-empty');
  assert(input && empty && options.length > 0, 'createMenu: dialog is missing its input, options, or empty state');
  let visible = options;
  let active = -1;

  const setActive = (index) => {
    if (active >= 0 && visible[active]) visible[active].setAttribute('aria-selected', 'false');
    active = index;
    if (active < 0) { input.removeAttribute('aria-activedescendant'); return; }
    visible[active].setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', visible[active].id);
    visible[active].scrollIntoView({ block: 'nearest' });
  };

  const filter = () => {
    setActive(-1);
    visible = options.filter((option) => {
      const show = matches(`${option.textContent} ${option.dataset.keywords ?? ''}`, input.value);
      option.hidden = !show;
      return show;
    });
    for (const group of groups) group.hidden = !group.querySelector('[role="option"]:not([hidden])');
    empty.hidden = visible.length > 0;
    setActive(visible.length ? 0 : -1);
  };

  const run = (option) => {
    dialog.close();
    onAction(option.dataset.action, option.dataset.value);
  };

  input.addEventListener('input', filter);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(step(active, visible.length, event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      run(visible[active]);
    }
  });
  for (const option of options) {
    option.addEventListener('click', () => run(option));
    option.addEventListener('pointermove', () => { const index = visible.indexOf(option); if (index !== active && index >= 0) setActive(index); });
  }
  // A click on the backdrop lands on the dialog element itself.
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

  return {
    open() {
      if (dialog.open) return;
      input.value = '';
      filter();
      dialog.showModal();
      input.focus();
    },
  };
}
