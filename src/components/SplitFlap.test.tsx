import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SplitFlap, flapMotion } from './SplitFlap';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../app.css'), 'utf8');

function keyframe(name: string): string {
  const start = css.indexOf(`@keyframes ${name} {`);
  expect(start, name).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('\n}', start));
}

describe('split flap direction', () => {
  it('sends a higher score up and a lower score down', () => {
    expect(flapMotion('4', '5')).toBe('up');
    expect(flapMotion('5', '6')).toBe('up');
    expect(flapMotion('6', '7')).toBe('up');
    expect(flapMotion('9', '10')).toBe('up');
    expect(flapMotion('6', '5')).toBe('down');
    expect(flapMotion('7', '6')).toBe('down');
    expect(flapMotion('10', '9')).toBe('down');
    expect(flapMotion('–', '0')).toBe('up');
  });

  it('maps plus upward and minus downward in the keyframes', () => {
    const leaveUp = keyframe('drive-out');
    const enterUp = keyframe('drive-in');
    const leaveDown = keyframe('drive-out-down');
    const enterDown = keyframe('drive-in-down');
    expect(leaveUp).toContain('translateY(-110%)');
    expect(enterUp).toContain('translateY(110%)');
    expect(leaveDown).toContain('translateY(110%)');
    expect(enterDown).toContain('translateY(-110%)');
    expect(css).toContain('.flap.is-down .flap-leave { animation-name: drive-out-down; }');
    expect(css).toContain('.flap.is-down .flap-enter { animation-name: drive-in-down; }');
  });

  it('sizes the portrait digit to the free column and keeps two characters inside it', () => {
    const rule = css.slice(css.indexOf('.current-set .num {'), css.indexOf('.current-set .flap-current'));
    expect(rule).toContain('overflow: visible');
    expect(rule).toContain('letter-spacing: 0');
    expect(rule).toContain('text-box-trim: trim-both');
    expect(rule).toContain('100cqh / 0.8');
    expect(rule).toContain('100cqw / 0.66');
    expect(rule).not.toContain('18rem');
    const two = css.slice(css.indexOf('.current-set .num[data-chars="2"]'), css.indexOf('.current-set.is-won'));
    expect(two).toContain('100cqh / 0.8');
    expect(two).toContain('100cqw / 1.24');
    expect(css).toContain('font-variant-numeric: tabular-nums');
    expect(renderToStaticMarkup(<SplitFlap value="4" />)).toContain('data-chars="1"');
    expect(renderToStaticMarkup(<SplitFlap value="10" />)).toContain('data-chars="2"');
  });

  it('keeps landscape set digits inside the cell, including 0, 6, and 10', () => {
    const rule = css.slice(css.indexOf('.num,\n.flap {'), css.indexOf('.set.is-won'));
    expect(rule).toContain('letter-spacing: 0');
    expect(rule).not.toContain('letter-spacing: -0.055em');
    expect(rule).toContain('100cqw / 1.35');
    expect(rule).toContain('92cqh');
    const flap = css.slice(css.indexOf('.set .flap {'), css.indexOf('.set.is-won'));
    expect(flap).toContain('overflow: visible');
    const plus = css.slice(css.indexOf('.step-plus,'), css.indexOf('.step:disabled'));
    expect(plus).toContain('background: transparent');
    expect(plus).toContain('box-shadow: inset 0 0 0 3px var(--accent)');
    expect(plus).not.toContain('background: var(--accent)');
  });
});
