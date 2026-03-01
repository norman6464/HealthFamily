import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangeSelector } from '@/components/shared/DateRangeSelector';

describe('DateRangeSelector', () => {
  it('開始日と終了日のラベルが表示される', () => {
    render(<DateRangeSelector startDate="" endDate="" onStartChange={vi.fn()} onEndChange={vi.fn()} />);
    expect(screen.getByLabelText('開始日')).toBeInTheDocument();
    expect(screen.getByLabelText('終了日')).toBeInTheDocument();
  });

  it('開始日を変更するとonStartChangeが呼ばれる', () => {
    const onStartChange = vi.fn();
    render(<DateRangeSelector startDate="" endDate="" onStartChange={onStartChange} onEndChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('開始日'), { target: { value: '2025-06-01' } });
    expect(onStartChange).toHaveBeenCalledWith('2025-06-01');
  });

  it('終了日を変更するとonEndChangeが呼ばれる', () => {
    const onEndChange = vi.fn();
    render(<DateRangeSelector startDate="" endDate="" onStartChange={vi.fn()} onEndChange={onEndChange} />);
    fireEvent.change(screen.getByLabelText('終了日'), { target: { value: '2025-06-30' } });
    expect(onEndChange).toHaveBeenCalledWith('2025-06-30');
  });

  it('初期値が正しく表示される', () => {
    render(<DateRangeSelector startDate="2025-01-01" endDate="2025-01-31" onStartChange={vi.fn()} onEndChange={vi.fn()} />);
    expect(screen.getByLabelText('開始日')).toHaveValue('2025-01-01');
    expect(screen.getByLabelText('終了日')).toHaveValue('2025-01-31');
  });
});
