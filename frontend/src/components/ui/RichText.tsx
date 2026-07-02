import DOMPurify from 'isomorphic-dompurify';
import katex from 'katex';

/**
 * Hiển thị nội dung GIÀU ĐỊNH DẠNG: HTML cơ bản (B/I/U, sup/sub…) + công thức
 * toán LaTeX. Cú pháp công thức: `$$...$$` (khối) hoặc `$...$` (trong dòng).
 * Luôn sanitize bằng DOMPurify trước khi render (FR an toàn).
 */
function tex(src: string, displayMode: boolean): string {
  try {
    return katex.renderToString(src, {
      displayMode,
      throwOnError: false,
      output: 'html',
    });
  } catch {
    return src;
  }
}

function renderMath(input: string): string {
  return input
    .replace(/\$\$([^$]+)\$\$/g, (_m, s: string) => tex(s, true))
    .replace(/\$([^$\n]+)\$/g, (_m, s: string) => tex(s, false));
}

export function RichText({
  text,
  className = '',
}: {
  text?: string | null;
  className?: string;
}) {
  const html = DOMPurify.sanitize(renderMath(text ?? ''), {
    ADD_ATTR: ['style', 'aria-hidden'], // KaTeX dùng inline style để canh chữ
  });
  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
