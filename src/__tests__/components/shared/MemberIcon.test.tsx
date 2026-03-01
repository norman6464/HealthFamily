import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemberIcon } from '@/components/shared/MemberIcon';

describe('MemberIcon', () => {
  it('人間メンバーにはUserアイコンを表示する', () => {
    const { container } = render(<MemberIcon memberType="human" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('ペット（犬）にはDogアイコンを表示する', () => {
    const { container } = render(<MemberIcon memberType="pet" petType="dog" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('ペット（猫）にはCatアイコンを表示する', () => {
    const { container } = render(<MemberIcon memberType="pet" petType="cat" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('ペット（その他）にはPawPrintアイコンを表示する', () => {
    const { container } = render(<MemberIcon memberType="pet" petType="other" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('petTypeなしのペットにはPawPrintアイコンを表示する', () => {
    const { container } = render(<MemberIcon memberType="pet" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('デフォルトサイズが24である', () => {
    const { container } = render(<MemberIcon memberType="human" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('カスタムサイズを指定できる', () => {
    const { container } = render(<MemberIcon memberType="pet" petType="rabbit" size={36} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '36');
    expect(svg).toHaveAttribute('height', '36');
  });

  it('カスタムクラス名を適用できる', () => {
    const { container } = render(<MemberIcon memberType="human" className="text-red-500" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('text-red-500');
  });
});
