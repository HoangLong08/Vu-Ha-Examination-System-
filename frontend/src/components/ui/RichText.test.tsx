import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RichText } from './RichText';

describe('RichText', () => {
  it('giữ định dạng HTML (B/I/U)', () => {
    const { container } = render(
      <RichText text="Xin <b>chào</b> <i>bạn</i>" />,
    );
    expect(container.querySelector('b')?.textContent).toBe('chào');
    expect(container.querySelector('i')?.textContent).toBe('bạn');
  });

  it('render công thức toán $...$ bằng KaTeX', () => {
    const { container } = render(<RichText text="Năng lượng $E=mc^2$ nhé" />);
    // KaTeX gắn class .katex vào output
    expect(container.querySelector('.katex')).toBeTruthy();
  });

  it('công thức khối $$...$$', () => {
    const { container } = render(<RichText text="$$\\frac{a}{b}$$" />);
    expect(container.querySelector('.katex')).toBeTruthy();
  });

  it('text rỗng không lỗi', () => {
    const { container } = render(<RichText text={null} />);
    expect(container).toBeTruthy();
  });

  it('loại bỏ script độc hại (sanitize)', () => {
    const { container } = render(
      <RichText text={'ok<script>alert(1)</script>'} />,
    );
    expect(container.querySelector('script')).toBeNull();
  });
});
