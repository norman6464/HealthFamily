import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentList, getAppointmentCounts } from '@/components/appointments/AppointmentList';
import { Appointment } from '@/domain/entities/Appointment';

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 5);

const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 5);

const createAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'apt-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  hospitalName: 'テスト病院',
  appointmentType: 'checkup',
  appointmentDate: futureDate,
  reminderEnabled: true,
  reminderDaysBefore: 1,
  createdAt: new Date(),
  ...overrides,
});

describe('getAppointmentCounts', () => {
  it('今後と過去の件数を正しく算出する', () => {
    const appointments = [
      createAppointment({ id: 'apt-1', appointmentDate: futureDate }),
      createAppointment({ id: 'apt-2', appointmentDate: pastDate }),
      createAppointment({ id: 'apt-3', appointmentDate: futureDate }),
    ];
    const counts = getAppointmentCounts(appointments);
    expect(counts.upcoming).toBe(2);
    expect(counts.past).toBe(1);
  });

  it('空配列で0を返す', () => {
    const counts = getAppointmentCounts([]);
    expect(counts.upcoming).toBe(0);
    expect(counts.past).toBe(0);
  });
});

describe('AppointmentList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it('読み込み中を表示する', () => {
    render(<AppointmentList appointments={[]} isLoading={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<AppointmentList appointments={[]} isLoading={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('通院予定がありません')).toBeInTheDocument();
  });

  it('upcomingフィルターで今後の予定のみ表示する', () => {
    const appointments = [
      createAppointment({ id: 'apt-1', appointmentDate: futureDate, memberName: '未来さん' }),
      createAppointment({ id: 'apt-2', appointmentDate: pastDate, memberName: '過去さん' }),
    ];
    render(<AppointmentList appointments={appointments} isLoading={false} filter="upcoming" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('未来さん')).toBeInTheDocument();
    expect(screen.queryByText('過去さん')).not.toBeInTheDocument();
  });

  it('pastフィルターで過去の予定のみ表示する', () => {
    const appointments = [
      createAppointment({ id: 'apt-1', appointmentDate: futureDate, memberName: '未来さん' }),
      createAppointment({ id: 'apt-2', appointmentDate: pastDate, memberName: '過去さん' }),
    ];
    render(<AppointmentList appointments={appointments} isLoading={false} filter="past" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.queryByText('未来さん')).not.toBeInTheDocument();
    expect(screen.getByText('過去さん')).toBeInTheDocument();
  });

  it('削除ボタンでonDeleteが呼ばれる', () => {
    const appointments = [createAppointment()];
    render(<AppointmentList appointments={appointments} isLoading={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(mockOnDelete).toHaveBeenCalledWith('apt-1');
  });

  it('編集ボタンでonEditが呼ばれる', () => {
    const apt = createAppointment();
    render(<AppointmentList appointments={[apt]} isLoading={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(mockOnEdit).toHaveBeenCalledWith(apt);
  });
});
