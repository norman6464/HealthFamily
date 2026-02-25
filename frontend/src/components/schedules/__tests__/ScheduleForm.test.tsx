import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleForm } from '../ScheduleForm';

describe('ScheduleForm', () => {
  it('フォームが正しく表示される', () => {
    render(<ScheduleForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('服薬時刻')).toBeInTheDocument();
    expect(screen.getByText('曜日')).toBeInTheDocument();
    expect(screen.getByLabelText('リマインダー（分前）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'スケジュールを追加' })).toBeInTheDocument();
  });

  it('全曜日のチェックボックスが表示される', () => {
    render(<ScheduleForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('月')).toBeInTheDocument();
    expect(screen.getByLabelText('火')).toBeInTheDocument();
    expect(screen.getByLabelText('水')).toBeInTheDocument();
    expect(screen.getByLabelText('木')).toBeInTheDocument();
    expect(screen.getByLabelText('金')).toBeInTheDocument();
    expect(screen.getByLabelText('土')).toBeInTheDocument();
    expect(screen.getByLabelText('日')).toBeInTheDocument();
  });

  it('フォーム送信時にonSubmitが呼ばれる', () => {
    const onSubmit = vi.fn();
    render(<ScheduleForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('服薬時刻'), { target: { value: '08:00' } });
    fireEvent.click(screen.getByLabelText('月'));
    fireEvent.click(screen.getByLabelText('水'));
    fireEvent.click(screen.getByLabelText('金'));

    fireEvent.click(screen.getByRole('button', { name: 'スケジュールを追加' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduledTime: '08:00',
        daysOfWeek: expect.arrayContaining(['mon', 'wed', 'fri']),
      })
    );
  });

  it('曜日が選択されていない場合、送信されない', () => {
    const onSubmit = vi.fn();
    render(<ScheduleForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('服薬時刻'), { target: { value: '08:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'スケジュールを追加' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('リマインダー時間を設定できる', () => {
    const onSubmit = vi.fn();
    render(<ScheduleForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('服薬時刻'), { target: { value: '12:00' } });
    fireEvent.change(screen.getByLabelText('リマインダー（分前）'), { target: { value: '30' } });
    fireEvent.click(screen.getByLabelText('月'));

    fireEvent.click(screen.getByRole('button', { name: 'スケジュールを追加' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduledTime: '12:00',
        reminderMinutesBefore: 30,
      })
    );
  });
});
