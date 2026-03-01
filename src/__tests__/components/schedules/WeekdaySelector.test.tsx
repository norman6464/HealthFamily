import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekdaySelector } from '@/components/schedules/WeekdaySelector';

describe('WeekdaySelector', () => {
  it('全曜日のチェックボックスを表示する', () => {
    render(<WeekdaySelector selectedDays={[]} onChange={vi.fn()} />);
    expect(screen.getByLabelText('月')).toBeInTheDocument();
    expect(screen.getByLabelText('火')).toBeInTheDocument();
    expect(screen.getByLabelText('水')).toBeInTheDocument();
    expect(screen.getByLabelText('木')).toBeInTheDocument();
    expect(screen.getByLabelText('金')).toBeInTheDocument();
    expect(screen.getByLabelText('土')).toBeInTheDocument();
    expect(screen.getByLabelText('日')).toBeInTheDocument();
  });

  it('選択された曜日がチェックされる', () => {
    render(<WeekdaySelector selectedDays={['月', '水', '金']} onChange={vi.fn()} />);
    expect(screen.getByLabelText('月')).toBeChecked();
    expect(screen.getByLabelText('水')).toBeChecked();
    expect(screen.getByLabelText('金')).toBeChecked();
    expect(screen.getByLabelText('火')).not.toBeChecked();
  });

  it('チェックボックスをクリックするとonChangeが呼ばれる', () => {
    const onChange = vi.fn();
    render(<WeekdaySelector selectedDays={['月']} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('火'));
    expect(onChange).toHaveBeenCalledWith(['月', '火']);
  });

  it('選択済みの曜日をクリックすると解除される', () => {
    const onChange = vi.fn();
    render(<WeekdaySelector selectedDays={['月', '水']} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('月'));
    expect(onChange).toHaveBeenCalledWith(['水']);
  });

  it('無効状態にできる', () => {
    render(<WeekdaySelector selectedDays={[]} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('月')).toBeDisabled();
  });
});
