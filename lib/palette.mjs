// The colour palette: Charcoal, Sand, and Electric Blue. dist/styles.css declares the same values as CSS custom
// properties (tests/palette.test.mjs keeps the two in step); this module feeds everything CSS can't reach:
// share images, the favicon, theme-color meta tags, and the /design style guide.

export const PALETTE = {
  light: {
    bg: '#f4efe6',
    surface: '#ebe3d5',
    'surface-strong': '#d8cbb3',
    border: '#ddd3c2',
    text: '#1e1e1c',
    'text-muted': '#5c574e',
    accent: '#2f6bff',
    'accent-hover': '#1f55e0',
    link: '#1a44b8',
    success: '#3e7b4f',
    warning: '#b7791f',
    danger: '#b4473c',
  },
  dark: {
    bg: '#1e1e1c',
    surface: '#272725',
    'surface-strong': '#32322e',
    border: '#34342f',
    text: '#ede6d8',
    'text-muted': '#a39c8e',
    accent: '#2f6bff',
    'accent-hover': '#4a7fff',
    link: '#6e9bff',
    success: '#3e7b4f',
    warning: '#b7791f',
    danger: '#b4473c',
  },
};

// White on #2f6bff is 4.4988:1, just under WCAG AA. Primary buttons use the nearest blue that passes, and press
// darker in both themes, because white on dark mode's #4a7fff hover is only 3.64:1.
export const BUTTON = { bg: '#2e6aff', hover: '#1f55e0', ink: '#ffffff' };

export const TOKEN_NAMES = Object.keys(PALETTE.light);

/**
 * WCAG 2 contrast ratio between two #rrggbb colours.
 */
export function contrast(a, b) {
  const luminance = (hex) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) throw Error('contrast: expected #rrggbb, got ' + hex);
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, b2] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Every text-on-background pair the site uses, with the minimum it must meet: 4.5 for body text, 3 for large text
// and UI marks. Rendered on /design and checked by the tests.
export const CONTRAST_PAIRS = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface-strong', 4.5],
  ['text-muted', 'bg', 4.5], ['text-muted', 'surface', 4.5],
  ['link', 'bg', 4.5], ['link', 'surface', 4.5],
  ['accent', 'bg', 3], ['bg', 'text', 4.5],
  ['success', 'bg', 3], ['warning', 'bg', 3], ['danger', 'bg', 3],
];
