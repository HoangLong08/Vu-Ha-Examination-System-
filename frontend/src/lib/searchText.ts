/**
 * Chuẩn hoá chuỗi tìm kiếm: thường hoá, bỏ khoảng trắng thừa, bỏ dấu tiếng Việt.
 * Dùng để so khớp không phân biệt hoa/thường, có dấu/không dấu, khoảng trắng.
 *
 * Ví dụ: "Võ  Đức   Yên" -> "vo duc yen"
 */
export function normalizeSearchText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu (tổ hợp Unicode)
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
