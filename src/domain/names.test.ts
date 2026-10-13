import { describe, expect, it } from 'vitest';
import { isValidStoredName, sanitizeTeamName } from './names';

describe('sanitizeTeamName', () => {
  it('limits length by code point and strips controls and bidi marks', () => {
    expect(sanitizeTeamName(`\u202E${'A'.repeat(25)}`, 'a')).toBe('A'.repeat(20));
    expect(sanitizeTeamName('Zeile\u0000\nZwei', 'b')).toBe('ZeileZwei');
    expect(sanitizeTeamName('   ', 'a')).toBe('Team A');
    expect(sanitizeTeamName('äöü', 'b')).toBe('äöü');
    const emojis = '🎾'.repeat(25);
    expect(Array.from(sanitizeTeamName(emojis, 'a'))).toHaveLength(20);
  });

  it('rejects tampered stored names instead of repairing them', () => {
    expect(isValidStoredName('Team A')).toBe(true);
    expect(isValidStoredName('A'.repeat(21))).toBe(false);
    expect(isValidStoredName(' Bad')).toBe(false);
    expect(isValidStoredName('A\u200B')).toBe(false);
    expect(isValidStoredName('A\uD800')).toBe(false);
  });
});
