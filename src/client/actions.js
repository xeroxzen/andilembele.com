// Small page actions: copy buttons on code blocks and email, print, and the toast that reports them.

const MAX_CODE_BLOCKS = 100;
const TOAST_MS = 2500;
const RESET_MS = 2000;

let toastTimer = null;

export function toast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('toast-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.classList.remove('toast-visible'); node.textContent = ''; }, TOAST_MS);
}

/**
 * Copy text and report the result. Clipboard access can be refused, so failure shows the text instead.
 */
export async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} copied.`);
    return true;
  } catch {
    toast(`Copy failed. ${label}: ${text}`);
    return false;
  }
}

function addCodeCopy(pre) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-code';
  button.textContent = 'Copy';
  button.addEventListener('click', async () => {
    const copied = await copyText(pre.querySelector('code')?.textContent ?? pre.textContent, 'Code');
    button.textContent = copied ? 'Copied' : 'Failed';
    setTimeout(() => { button.textContent = 'Copy'; }, RESET_MS);
  });
  pre.classList.add('has-copy');
  pre.append(button);
}

export function initActions(doc) {
  for (const pre of [...doc.querySelectorAll('[data-copy-code] pre')].slice(0, MAX_CODE_BLOCKS)) addCodeCopy(pre);
  for (const button of doc.querySelectorAll('[data-copy-text]')) {
    button.addEventListener('click', () => { copyText(button.dataset.copyText, 'Email address'); });
  }
  for (const button of doc.querySelectorAll('[data-print]')) button.addEventListener('click', () => window.print());
}
