import { describe, it, expect } from 'vitest';
import { matchesExamDate } from './page';

describe('matchesExamDate', () => {
  it('matches when filter is "all" regardless of room date', () => {
    expect(matchesExamDate('2026-07-11', 'all')).toBe(true);
    expect(matchesExamDate('', 'all')).toBe(true);
  });

  it('matches by yyyy-mm-dd only, ignoring any time/timezone suffix', () => {
    expect(matchesExamDate('2026-07-11T08:00:00.000Z', '2026-07-11')).toBe(
      true,
    );
  });

  it('does not match a different date', () => {
    expect(matchesExamDate('2026-07-11', '2026-07-12')).toBe(false);
  });

  it('does not match when the room has no date', () => {
    expect(matchesExamDate('', '2026-07-11')).toBe(false);
  });
});
