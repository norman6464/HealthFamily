import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimePickerInput } from '@/components/shared/TimePickerInput';

describe('TimePickerInput', () => {
  it('ラベルを表示する', () => {
    render(<TimePickerInput label="服薬時間" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('服薬時間')).toBeInTheDocument();
  });

  it('初期値を表示する', () => {
    render(<TimePickerInput label="時間" value="08:30" onChange={vi.fn()} />);
    expect(screen.getByLabelText('時間')).toHaveValue('08:30');
  });

  it('値を変更するとonChangeが呼ばれる', () => {
    const onChange = vi.fn();
    render(<TimePickerInput label="時間" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('時間'), { target: { value: '09:00' } });
    expect(onChange).toHaveBeenCalledWith('09:00');
  });

  it('エラーメッセージを表示する', () => {
    render(<TimePickerInput label="時間" value="" onChange={vi.fn()} error="時間を入力してください" />);
    expect(screen.getByText('時間を入力してください')).toBeInTheDocument();
  });

  it('無効状態にできる', () => {
    render(<TimePickerInput label="時間" value="10:00" onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('時間')).toBeDisabled();
  });
});
