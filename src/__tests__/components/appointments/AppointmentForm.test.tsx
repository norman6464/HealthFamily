import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { Member } from '@/domain/entities/Member';
import { Hospital } from '@/domain/entities/Hospital';

const mockMembers: Member[] = [
  { id: 'm1', userId: 'u1', memberType: 'human', name: '太郎', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'm2', userId: 'u1', memberType: 'pet', petType: 'dog', name: 'ポチ', isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockHospitals: Hospital[] = [
  { id: 'h1', userId: 'u1', name: '東京病院', createdAt: new Date() },
];

describe('AppointmentForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('フォームフィールドが表示される', () => {
    render(<AppointmentForm members={mockMembers} hospitals={mockHospitals} onSubmit={mockOnSubmit} />);
    expect(screen.getByText('メンバー')).toBeInTheDocument();
    expect(screen.getByLabelText('予約日')).toBeInTheDocument();
    expect(screen.getByLabelText(/種別/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
  });

  it('メンバー一覧が表示される', () => {
    render(<AppointmentForm members={mockMembers} hospitals={mockHospitals} onSubmit={mockOnSubmit} />);
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('ポチ')).toBeInTheDocument();
  });

  it('病院が選択肢に表示される', () => {
    render(<AppointmentForm members={mockMembers} hospitals={mockHospitals} onSubmit={mockOnSubmit} />);
    expect(screen.getByText('東京病院')).toBeInTheDocument();
  });

  it('日付未入力で送信できない', () => {
    render(<AppointmentForm members={mockMembers} hospitals={mockHospitals} onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('正しいデータで送信される', () => {
    render(<AppointmentForm members={mockMembers} hospitals={mockHospitals} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('予約日'), { target: { value: '2025-06-01' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      memberId: 'm1',
      appointmentDate: '2025-06-01',
    }));
  });

  it('編集モードで更新ボタンが表示される', () => {
    const initialData = {
      id: 'a1', userId: 'u1', memberId: 'm1', appointmentDate: new Date('2025-06-01'),
      reminderEnabled: false, reminderDaysBefore: 0, createdAt: new Date(),
    };
    render(<AppointmentForm members={mockMembers} hospitals={mockHospitals} onSubmit={mockOnSubmit} initialData={initialData} />);
    expect(screen.getByText('更新する')).toBeInTheDocument();
  });

  it('キャンセルボタンが編集モードで表示される', () => {
    const onCancel = vi.fn();
    const initialData = {
      id: 'a1', userId: 'u1', memberId: 'm1', appointmentDate: new Date('2025-06-01'),
      reminderEnabled: false, reminderDaysBefore: 0, createdAt: new Date(),
    };
    render(<AppointmentForm members={mockMembers} hospitals={mockHospitals} onSubmit={mockOnSubmit} initialData={initialData} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(onCancel).toHaveBeenCalled();
  });
});
