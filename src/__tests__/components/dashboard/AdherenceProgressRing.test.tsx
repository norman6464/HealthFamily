import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdherenceProgressRing } from '@/components/dashboard/AdherenceProgressRing';

describe('AdherenceProgressRing', () => {
  it('パーセンテージとラベルを表示する', () => {
    render(<AdherenceProgressRing percentage={85} label="週間" />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('週間')).toBeInTheDocument();
  });

  it('SVG要素が描画される', () => {
    const { container } = render(<AdherenceProgressRing percentage={50} label="月間" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('0%の場合にプログレスが表示されない', () => {
    const { container } = render(<AdherenceProgressRing percentage={0} label="週間" />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('100%の場合に正しく表示される', () => {
    render(<AdherenceProgressRing percentage={100} label="月間" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('カスタムサイズを適用できる', () => {
    const { container } = render(<AdherenceProgressRing percentage={75} label="週間" size={120} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
  });
});
