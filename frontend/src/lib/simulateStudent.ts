/**
 * Sinh hồ sơ sinh viên GIẢ LẬP (mã SV, lớp, khoa, ngày sinh) deterministic theo
 * seed (email/id) — để mỗi tài khoản test hiển thị thông tin khác nhau, sinh động
 * giống thật. Đồng bộ ý tưởng với backend auth.names (tên Việt giả lập).
 */
const FACULTIES = [
  { code: 'CT', name: 'Công nghệ thông tin' },
  { code: 'KT', name: 'Kiến trúc' },
  { code: 'XD', name: 'Kỹ thuật Xây dựng' },
  { code: 'KX', name: 'Kinh tế' },
  { code: 'MT', name: 'Mỹ thuật Ứng dụng' },
  { code: 'NN', name: 'Ngôn ngữ' },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export interface SimulatedStudent {
  studentCode: string;
  className: string;
  faculty: string;
  dob: string; // dd/mm/yyyy
}

export function simulateStudent(seed: string): SimulatedStudent {
  const s = (seed || 'sv').toLowerCase();
  // Hash có "muối" riêng từng trường để đa dạng kể cả email tuần tự.
  const fac = FACULTIES[hash('fac:' + s) % FACULTIES.length];
  const classNo = (hash('cls:' + s) % 3) + 1;
  const group = (hash('grp:' + s) % 9) + 1;
  const className = `21${fac.code}${classNo}${group}`; // vd 21CT11
  const seq = String((hash('seq:' + s) % 9000) + 1000); // 1000..9999
  const studentCode = `SV21${(hash('cod:' + s) % 9) + 1}0${seq}`; // vd SV2110xxxx
  const day = (hash('day:' + s) % 28) + 1;
  const month = (hash('mon:' + s) % 12) + 1;
  const year = 2002 + (hash('yr:' + s) % 3);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    studentCode,
    className,
    faculty: fac.name,
    dob: `${pad(day)}/${pad(month)}/${year}`,
  };
}
