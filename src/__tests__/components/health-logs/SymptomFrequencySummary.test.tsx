import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SymptomFrequencySummary } from '../../../components/health-logs/SymptomFrequencySummary';

describe('SymptomFrequencySummary', () => {
  it('症状がない場合は何も表示しない', () => {
    const { container } = render(<SymptomFrequencySummary symptoms={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('症状頻度を表示する', () => {
    const symptoms = [
      { symptom: 'headache' as const, count: 5 },
      { symptom: 'fatigue' as const, count: 3 },
    ];
    render(<SymptomFrequencySummary symptoms={symptoms} />);
    expect(screen.getByText('頭痛')).toBeDefined();
    expect(screen.getByText('倦怠感')).toBeDefined();
    expect(screen.getByText('5回')).toBeDefined();
    expect(screen.getByText('3回')).toBeDefined();
  });

  it('タイトルを表示する', () => {
    const symptoms = [{ symptom: 'fever' as const, count: 2 }];
    render(<SymptomFrequencySummary symptoms={symptoms} />);
    expect(screen.getByText('よく記録された症状')).toBeDefined();
  });

  it('バーの幅が最大カウントに対する割合で表示される', () => {
    const symptoms = [
      { symptom: 'headache' as const, count: 10 },
      { symptom: 'fever' as const, count: 5 },
    ];
    const { container } = render(<SymptomFrequencySummary symptoms={symptoms} />);
    const bars = container.querySelectorAll('[data-testid="symptom-bar"]');
    expect(bars.length).toBe(2);
    expect((bars[0] as HTMLElement).style.width).toBe('100%');
    expect((bars[1] as HTMLElement).style.width).toBe('50%');
  });
});
