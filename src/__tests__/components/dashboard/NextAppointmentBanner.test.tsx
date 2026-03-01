import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextAppointmentBanner } from '@/components/dashboard/NextAppointmentBanner';

describe('NextAppointmentBanner', () => {
  it('予約がない場合に何も表示しない', () => {
    const { container } = render(<NextAppointmentBanner appointments={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('次の予約情報を表示する', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointments = [{
      id: 'apt-1',
      userId: 'user-1',
      memberId: 'member-1',
      memberName: '太郎',
      hospitalName: '東京病院',
      appointmentDate: tomorrow,
      reminderEnabled: false,
      reminderDaysBefore: 0,
      createdAt: new Date(),
    }];
    render(<NextAppointmentBanner appointments={appointments} />);
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText(/東京病院/)).toBeInTheDocument();
  });

  it('過去の予約は表示しない', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const appointments = [{
      id: 'apt-1',
      userId: 'user-1',
      memberId: 'member-1',
      memberName: '太郎',
      appointmentDate: yesterday,
      reminderEnabled: false,
      reminderDaysBefore: 0,
      createdAt: new Date(),
    }];
    const { container } = render(<NextAppointmentBanner appointments={appointments} />);
    expect(container.firstChild).toBeNull();
  });

  it('最も近い予約を表示する', () => {
    const twoDays = new Date();
    twoDays.setDate(twoDays.getDate() + 2);
    const fiveDays = new Date();
    fiveDays.setDate(fiveDays.getDate() + 5);
    const appointments = [
      { id: 'apt-1', userId: 'u', memberId: 'm', memberName: '遠い予約', appointmentDate: fiveDays, reminderEnabled: false, reminderDaysBefore: 0, createdAt: new Date() },
      { id: 'apt-2', userId: 'u', memberId: 'm', memberName: '近い予約', appointmentDate: twoDays, reminderEnabled: false, reminderDaysBefore: 0, createdAt: new Date() },
    ];
    render(<NextAppointmentBanner appointments={appointments} />);
    expect(screen.getByText('近い予約')).toBeInTheDocument();
  });
});
