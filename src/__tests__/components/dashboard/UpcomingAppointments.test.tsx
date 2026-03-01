import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { Appointment } from '@/domain/entities/Appointment';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const createAppointment = (daysFromNow: number, overrides: Partial<Appointment> = {}): Appointment => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return {
    id: `apt-${daysFromNow}`,
    userId: 'user-1',
    memberId: 'member-1',
    memberName: 'テスト太郎',
    appointmentDate: date,
    reminderEnabled: true,
    reminderDaysBefore: 1,
    createdAt: new Date(),
    ...overrides,
  };
};

describe('UpcomingAppointments', () => {
  it('読み込み中は何も表示しない', () => {
    const { container } = render(<UpcomingAppointments appointments={[]} isLoading={true} />);
    expect(container.innerHTML).toBe('');
  });

  it('予定がない場合何も表示しない', () => {
    const { container } = render(<UpcomingAppointments appointments={[]} isLoading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('7日以内の予定のみ表示する', () => {
    const appointments = [
      createAppointment(3, { id: 'near', memberName: '近い予定' }),
      createAppointment(10, { id: 'far', memberName: '遠い予定' }),
    ];
    render(<UpcomingAppointments appointments={appointments} isLoading={false} />);
    expect(screen.getByText('近い予定')).toBeInTheDocument();
    expect(screen.queryByText('遠い予定')).not.toBeInTheDocument();
  });

  it('過去の予定を除外する', () => {
    const appointments = [
      createAppointment(-2, { id: 'past', memberName: '過去の予定' }),
      createAppointment(2, { id: 'future', memberName: '未来の予定' }),
    ];
    render(<UpcomingAppointments appointments={appointments} isLoading={false} />);
    expect(screen.queryByText('過去の予定')).not.toBeInTheDocument();
    expect(screen.getByText('未来の予定')).toBeInTheDocument();
  });

  it('最大3件まで表示する', () => {
    const appointments = [
      createAppointment(1, { id: 'a1', memberName: '予定1' }),
      createAppointment(2, { id: 'a2', memberName: '予定2' }),
      createAppointment(3, { id: 'a3', memberName: '予定3' }),
      createAppointment(4, { id: 'a4', memberName: '予定4' }),
    ];
    render(<UpcomingAppointments appointments={appointments} isLoading={false} />);
    expect(screen.getByText('予定1')).toBeInTheDocument();
    expect(screen.getByText('予定2')).toBeInTheDocument();
    expect(screen.getByText('予定3')).toBeInTheDocument();
    expect(screen.queryByText('予定4')).not.toBeInTheDocument();
  });

  it('すべて見るリンクを表示する', () => {
    const appointments = [createAppointment(1)];
    render(<UpcomingAppointments appointments={appointments} isLoading={false} />);
    expect(screen.getByText('すべて見る')).toBeInTheDocument();
  });
});
