import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { flapMotion } from './SplitFlap';

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

  it('sizes the portrait digit so two characters stay inside the column', () => {
    const rule = css.slice(css.indexOf('.current-set .num {'), css.indexOf('.current-set.is-won'));
    expect(rule).toContain('overflow: visible');
    expect(rule).toContain('letter-spacing: 0');
    expect(rule).toContain('clamp(');
    expect(rule).toContain('100cqw / 1.5');
    expect(rule).toContain('svh');
    expect(rule).toContain('vw');
    expect(css).toContain('font-variant-numeric: tabular-nums');
  });
});
