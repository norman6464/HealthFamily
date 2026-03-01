import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CharacterIcon } from '@/components/shared/CharacterIcon';

describe('CharacterIcon', () => {
  it('犬アイコンを表示する', () => {
    const { container } = render(<CharacterIcon type="dog" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('猫アイコンを表示する', () => {
    const { container } = render(<CharacterIcon type="cat" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('うさぎアイコンを表示する', () => {
    const { container } = render(<CharacterIcon type="rabbit" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('鳥アイコンを表示する', () => {
    const { container } = render(<CharacterIcon type="bird" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('デフォルトサイズが32である', () => {
    const { container } = render(<CharacterIcon type="dog" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('カスタムサイズを指定できる', () => {
    const { container } = render(<CharacterIcon type="cat" size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('カスタムクラス名を適用できる', () => {
    const { container } = render(<CharacterIcon type="rabbit" className="text-blue-500" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('text-blue-500');
  });
});
