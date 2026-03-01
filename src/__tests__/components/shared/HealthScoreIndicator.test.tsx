import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthScoreIndicator } from '@/components/shared/HealthScoreIndicator';

describe('HealthScoreIndicator', () => {
  it('スコアを表示する', () => {
    render(<HealthScoreIndicator score={85} />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('ラベルを表示する', () => {
    render(<HealthScoreIndicator score={90} label="服薬率" />);
    expect(screen.getByText('服薬率')).toBeInTheDocument();
  });

  it('高スコアの場合は緑色スタイルが適用される', () => {
    const { container } = render(<HealthScoreIndicator score={80} />);
    expect(container.querySelector('[class*="green"]')).toBeInTheDocument();
  });

  it('中スコアの場合は黄色スタイルが適用される', () => {
    const { container } = render(<HealthScoreIndicator score={55} />);
    expect(container.querySelector('[class*="yellow"]')).toBeInTheDocument();
  });

  it('低スコアの場合は赤色スタイルが適用される', () => {
    const { container } = render(<HealthScoreIndicator score={30} />);
    expect(container.querySelector('[class*="red"]')).toBeInTheDocument();
  });
});
