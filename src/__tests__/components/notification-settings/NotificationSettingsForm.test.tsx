import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationSettingsForm } from '../../../components/notification-settings/NotificationSettingsForm';
import { NotificationSetting } from '../../../domain/entities/NotificationSetting';

const mockSetting: NotificationSetting = {
  id: 'ns-1',
  userId: 'user-1',
  medicationReminderEnabled: true,
  missedMedicationEnabled: true,
  appointmentReminderEnabled: true,
  lowStockAlertEnabled: true,
  defaultReminderMinutesBefore: 5,
  defaultAppointmentReminderDaysBefore: 1,
  emailNotificationEnabled: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('NotificationSettingsForm', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSave = vi.fn().mockResolvedValue(undefined);
  });

  it('ローディング中はスピナーを表示する', () => {
    render(
      <NotificationSettingsForm setting={null} onSave={mockOnSave} isLoading={true} />,
    );

    expect(screen.queryByText('メール通知')).toBeNull();
  });

  it('通知設定が表示される', () => {
    render(
      <NotificationSettingsForm setting={mockSetting} onSave={mockOnSave} isLoading={false} />,
    );

    expect(screen.getByText('メール通知')).toBeTruthy();
    expect(screen.getByText('通知の種類')).toBeTruthy();
    expect(screen.getByText('服薬リマインダー')).toBeTruthy();
    expect(screen.getByText('飲み忘れ通知')).toBeTruthy();
    expect(screen.getByText('通院リマインダー')).toBeTruthy();
    expect(screen.getByText('在庫アラート')).toBeTruthy();
    expect(screen.getByText('デフォルトリマインダー')).toBeTruthy();
  });

  it('メール通知の切り替えボタンが動作する', async () => {
    render(
      <NotificationSettingsForm setting={mockSetting} onSave={mockOnSave} isLoading={false} />,
    );

    const emailToggle = screen.getByLabelText('メール通知の切り替え');
    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ emailNotificationEnabled: false });
    });
  });

  it('個別の通知タイプの切り替えが動作する', async () => {
    render(
      <NotificationSettingsForm setting={mockSetting} onSave={mockOnSave} isLoading={false} />,
    );

    const medicationToggle = screen.getByLabelText('服薬リマインダーの切り替え');
    fireEvent.click(medicationToggle);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ medicationReminderEnabled: false });
    });
  });

  it('リマインダー分数の選択が動作する', async () => {
    render(
      <NotificationSettingsForm setting={mockSetting} onSave={mockOnSave} isLoading={false} />,
    );

    const select = screen.getByDisplayValue('5分前');
    fireEvent.change(select, { target: { value: '15' } });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ defaultReminderMinutesBefore: 15 });
    });
  });

  it('通院リマインダー日数の選択が動作する', async () => {
    render(
      <NotificationSettingsForm setting={mockSetting} onSave={mockOnSave} isLoading={false} />,
    );

    const select = screen.getByDisplayValue('1日前');
    fireEvent.change(select, { target: { value: '3' } });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ defaultAppointmentReminderDaysBefore: 3 });
    });
  });

  it('設定がnullの場合はデフォルト値が使用される', () => {
    render(
      <NotificationSettingsForm setting={null} onSave={mockOnSave} isLoading={false} />,
    );

    expect(screen.getByText('メール通知')).toBeTruthy();
    expect(screen.getByDisplayValue('5分前')).toBeTruthy();
    expect(screen.getByDisplayValue('1日前')).toBeTruthy();
  });
});
