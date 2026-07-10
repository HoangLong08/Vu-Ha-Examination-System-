import { describe, it, expect } from 'vitest';
import { normalizeSearchText } from './searchText';

describe('normalizeSearchText', () => {
  it('removes Vietnamese accents', () => {
    expect(normalizeSearchText('Võ Đức Yên')).toBe('vo duc yen');
  });

  it('lower-cases', () => {
    expect(normalizeSearchText('AN')).toBe('an');
  });

  it('trims and collapses extra spaces', () => {
    expect(normalizeSearchText('  Lê   Thị  An  ')).toBe('le thi an');
  });

  it('handles null/undefined/empty safely', () => {
    expect(normalizeSearchText(null)).toBe('');
    expect(normalizeSearchText(undefined)).toBe('');
    expect(normalizeSearchText('')).toBe('');
  });

  it('leaves already-plain ASCII text unchanged (besides casing)', () => {
    expect(normalizeSearchText('PC-03')).toBe('pc-03');
  });
});
