import Image from 'next/image';

/**
 * Logo Trường Đại học Kiến trúc Đà Nẵng (DAU).
 * Dùng thay biểu tượng GraduationCap ở header/sidebar/login.
 *
 * `bare` = true: KHÔNG khung nền trắng/viền — logo trong suốt hợp nền tối
 * (dùng cho trang đăng nhập). Mặc định vẫn có nền trắng bo góc cho các chỗ
 * đặt trên nền màu (header/sidebar).
 */
export function BrandLogo({
  size = 42,
  rounded = 'rounded-xl',
  className = '',
  bare = false,
}: {
  size?: number;
  rounded?: string;
  className?: string;
  bare?: boolean;
}) {
  if (bare) {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo-dau.png"
          alt="Logo Đại học Kiến trúc Đà Nẵng"
          fill
          sizes={`${size}px`}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 ${rounded} bg-white flex items-center justify-center shadow-sm border border-black/5 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-dau.png"
        alt="Logo Đại học Kiến trúc Đà Nẵng"
        fill
        sizes={`${size}px`}
        className="object-contain p-1.5"
        priority
      />
    </div>
  );
}
