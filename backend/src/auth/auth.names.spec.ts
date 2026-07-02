import { simulateFullName } from './auth.names';

/** Tên Việt giả lập cho tài khoản test — deterministic + đa dạng. */
describe('simulateFullName', () => {
  it('deterministic: cùng email => cùng tên', () => {
    expect(simulateFullName('sv001@dau.edu.vn')).toBe(
      simulateFullName('sv001@dau.edu.vn'),
    );
  });

  it('có 3 phần (họ đệm tên) và là tên Việt', () => {
    const name = simulateFullName('sv042@dau.edu.vn');
    expect(name.split(' ').length).toBe(3);
    expect(name).toMatch(/[A-ZĐ]/);
  });

  it('đa dạng: nhiều email khác nhau cho >1 tên khác nhau', () => {
    const names = new Set(
      Array.from({ length: 30 }, (_, i) =>
        simulateFullName(`sv${i}@dau.edu.vn`),
      ),
    );
    expect(names.size).toBeGreaterThan(5);
  });

  it('không phụ thuộc phần sau @ (chỉ local part)', () => {
    expect(simulateFullName('sv001@dau.edu.vn')).toBe(
      simulateFullName('sv001@gmail.com'),
    );
  });
});
