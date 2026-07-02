/**
 * Sinh HỌ TÊN tiếng Việt GIẢ LẬP, deterministic theo email — để tài khoản test
 * (sv001, sv002…) hiển thị tên thật thay vì phần trước @.
 * Không dùng random (ổn định khi resume/seed lại).
 */
const HO = [
  'Nguyễn',
  'Trần',
  'Lê',
  'Phạm',
  'Hoàng',
  'Huỳnh',
  'Phan',
  'Vũ',
  'Võ',
  'Đặng',
  'Bùi',
  'Đỗ',
  'Hồ',
  'Ngô',
  'Dương',
  'Lý',
];
const DEM = [
  'Văn',
  'Thị',
  'Hữu',
  'Đức',
  'Minh',
  'Thanh',
  'Quang',
  'Gia',
  'Ngọc',
  'Hoàng',
];
const TEN = [
  'An',
  'Bình',
  'Cường',
  'Dũng',
  'Hà',
  'Hải',
  'Hùng',
  'Khoa',
  'Lan',
  'Linh',
  'Mai',
  'Nam',
  'Phúc',
  'Quân',
  'Sơn',
  'Trang',
  'Tú',
  'Vy',
  'Yến',
  'Anh',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Mã sinh viên giả lập — KHỚP công thức frontend lib/simulateStudent để mã ở
 * dashboard và màn giám thị giống nhau. */
export function simulateStudentCode(email: string): string {
  const s = (email || 'sv').toLowerCase();
  return `SV21${(hash('cod:' + s) % 9) + 1}0${(hash('seq:' + s) % 9000) + 1000}`;
}

/** Sĩ số lớp giả lập của một đề (deterministic, 24..40). */
export function simulateRosterSize(seed: string): number {
  return 24 + (hash('size:' + (seed || '')) % 17);
}

/** Số điện thoại di động VN giả lập (deterministic, 10 số). */
const PHONE_PREFIX = [
  '032',
  '033',
  '034',
  '035',
  '036',
  '037',
  '038',
  '039',
  '070',
  '076',
  '077',
  '078',
  '079',
  '081',
  '082',
  '083',
  '084',
  '085',
  '086',
  '088',
  '089',
  '090',
  '091',
  '093',
  '094',
];
export function simulatePhone(seed: string): string {
  const h = hash('phone:' + (seed || ''));
  const prefix = PHONE_PREFIX[h % PHONE_PREFIX.length];
  const rest = String(h % 10000000).padStart(7, '0');
  return prefix + rest;
}

/** Một "bạn cùng phòng" giả lập thứ i của đề (tên + mã SV + SĐT, deterministic). */
export function simulateClassmate(
  seed: string,
  i: number,
): { fullName: string; studentCode: string; phone: string } {
  const e = `${seed}#${i}`;
  const studentCode = simulateStudentCode(e);
  return {
    fullName: simulateFullName(e),
    studentCode,
    phone: simulatePhone(studentCode),
  };
}

/** Tên Việt giả lập từ email (deterministic). Hash có "muối" riêng từng phần để
 * tên đa dạng kể cả với email tuần tự (sv001, sv002…). */
export function simulateFullName(email: string): string {
  const local = (email.split('@')[0] || 'user').toLowerCase();
  const ho = HO[hash('ho:' + local) % HO.length];
  const dem = DEM[hash('dem:' + local) % DEM.length];
  const ten = TEN[hash('ten:' + local) % TEN.length];
  return `${ho} ${dem} ${ten}`;
}
