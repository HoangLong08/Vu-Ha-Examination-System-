import { describe, it, expect } from 'vitest';
import { simulateStudent } from './simulateStudent';

describe('simulateStudent', () => {
  it('deterministic theo seed', () => {
    expect(simulateStudent('sv001@dau.edu.vn')).toEqual(
      simulateStudent('sv001@dau.edu.vn')
    );
  });

  it('đủ trường + định dạng hợp lý', () => {
    const s = simulateStudent('sv042@dau.edu.vn');
    expect(s.studentCode).toMatch(/^SV21\d0\d{4}$/);
    expect(s.className).toMatch(/^21[A-Z]{2}\d{2}$/);
    expect(s.faculty.length).toBeGreaterThan(3);
    expect(s.dob).toMatch(/^\d{2}\/\d{2}\/20(0[2-4])$/);
  });

  it('đa dạng giữa các tài khoản', () => {
    const codes = new Set(
      Array.from({ length: 20 }, (_, i) => simulateStudent(`sv${i}`).studentCode)
    );
    expect(codes.size).toBeGreaterThan(8);
  });
});
