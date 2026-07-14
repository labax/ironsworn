import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles.css', 'utf8');

const pairs = [
  ['body text on page', '--ui-color-text', '--ui-color-background', 4.5],
  ['body text on surface', '--ui-color-text', '--ui-color-surface', 4.5],
  ['body text on subtle surface', '--ui-color-text', '--ui-color-surface-subtle', 4.5],
  ['muted text on page', '--ui-color-text-muted', '--ui-color-background', 4.5],
  ['muted text on surface', '--ui-color-text-muted', '--ui-color-surface', 4.5],
  ['muted text on subtle surface', '--ui-color-text-muted', '--ui-color-surface-subtle', 4.5],
  ['accent text on surface', '--ui-color-accent-strong', '--ui-color-surface', 4.5],
  ['accent text on accent soft', '--ui-color-accent-strong', '--ui-color-accent-soft', 4.5],
  ['success text on success soft', '--ui-color-success', '--ui-color-success-soft', 4.5],
  ['warning text on warning soft', '--ui-color-warning', '--ui-color-warning-soft', 4.5],
  ['danger text on danger soft', '--ui-color-danger', '--ui-color-danger-soft', 4.5],
  ['primary action text', '--ui-action-primary-text', '--ui-action-primary-bg', 4.5],
  ['primary hover action text', '--ui-action-primary-text', '--ui-action-primary-hover-bg', 4.5],
  ['secondary action text', '--ui-action-secondary-text', '--ui-action-secondary-bg', 4.5],
  ['destructive action text', '--ui-action-destructive-text', '--ui-action-destructive-bg', 4.5],
  ['disabled action text', '--ui-action-disabled-text', '--ui-action-disabled-bg', 4.5],
];

function declarations(source) {
  return Object.fromEntries([...source.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
function rootBlock() { return css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)')); }
function darkBlock() { return css.slice(css.indexOf('@media (prefers-color-scheme: dark)')); }
function resolve(value, tokens) {
  let result = value;
  for (let i = 0; i < 12 && result?.startsWith('var('); i += 1) result = tokens[result.match(/var\((--[\w-]+)/)?.[1]];
  return result;
}
function rgb(token, tokens) {
  const hex = resolve(tokens[token], tokens)?.match(/^#([\da-f]{6})$/i)?.[1];
  if (!hex) throw new Error(`Expected ${token} to resolve to a six-digit hex color.`);
  return [0, 2, 4].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
}
function luminance(token, tokens) {
  return rgb(token, tokens)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(foreground, background, tokens) {
  const [lighter, darker] = [luminance(foreground, tokens), luminance(background, tokens)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('semantic contrast tokens', () => {
  const light = declarations(rootBlock());
  const dark = { ...light, ...declarations(darkBlock()) };

  it.each([
    ['light', light],
    ['dark', dark],
  ])('%s mode foreground/background pairs meet WCAG normal-text contrast', (_mode, tokens) => {
    for (const [name, foreground, background, minimum] of pairs) {
      expect(contrast(foreground, background, tokens), name).toBeGreaterThanOrEqual(minimum);
    }
  });
});
