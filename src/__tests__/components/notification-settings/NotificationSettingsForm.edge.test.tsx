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

describe('NotificationSettingsForm エッジケース', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSave = vi.fn().mockResolvedValue(undefined);
  });

  it('メール通知無効時は個別トグルが無効化される', () => {
    const disabledSetting: NotificationSetting = {
      ...mockSetting,
      emailNotificationEnabled: false,
    };

    render(
      <NotificationSettingsForm setting={disabledSetting} onSave={mockOnSave} isLoading={false} />,
    );

    const medicationToggle = screen.getByLabelText('服薬リマインダーの切り替え');
    expect(medicationToggle).toBeDisabled();
  });

  it('保存失敗時にメール通知トグルがロールバックされる', async () => {
    mockOnSave.mockRejectedValueOnce(new Error('保存失敗'));

    render(
      <NotificationSettingsForm setting={mockSetting} onSave={mockOnSave} isLoading={false} />,
    );

    const emailToggle = screen.getByLabelText('メール通知の切り替え');
    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ emailNotificationEnabled: false });
    });

    // ロールバックの確認: aria-checkedがtrueに戻る
    await waitFor(() => {
      expect(emailToggle.getAttribute('aria-checked')).toBe('true');
    });
  });

  it('保存失敗時に個別通知トグルがロールバックされる', async () => {
    mockOnSave.mockRejectedValueOnce(new Error('保存失敗'));

    render(
      <NotificationSettingsForm setting={mockSetting} onSave={mockOnSave} isLoading={false} />,
    );

    const toggle = screen.getByLabelText('飲み忘れ通知の切り替え');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ missedMedicationEnabled: false });
    });

    await waitFor(() => {
      expect(toggle.getAttribute('aria-checked')).toBe('true');
    });
  });

  it('全通知が無効の設定が正しく表示される', () => {
    const allDisabled: NotificationSetting = {
      ...mockSetting,
      medicationReminderEnabled: false,
      missedMedicationEnabled: false,
      appointmentReminderEnabled: false,
      lowStockAlertEnabled: false,
      emailNotificationEnabled: false,
    };

    render(
      <NotificationSettingsForm setting={allDisabled} onSave={mockOnSave} isLoading={false} />,
    );

    const emailToggle = screen.getByLabelText('メール通知の切り替え');
    expect(emailToggle.getAttribute('aria-checked')).toBe('false');
  });

  it('リマインダー0分（なし）が正しく表示される', () => {
    const zeroMinutes: NotificationSetting = {
      ...mockSetting,
      defaultReminderMinutesBefore: 0,
    };

    render(
      <NotificationSettingsForm setting={zeroMinutes} onSave={mockOnSave} isLoading={false} />,
    );

    expect(screen.getByDisplayValue('なし')).toBeTruthy();
  });

  it('通院リマインダー当日が正しく表示される', () => {
    const zeroDays: NotificationSetting = {
      ...mockSetting,
      defaultAppointmentReminderDaysBefore: 0,
    };

    render(
      <NotificationSettingsForm setting={zeroDays} onSave={mockOnSave} isLoading={false} />,
    );

    expect(screen.getByDisplayValue('当日')).toBeTruthy();
  });

  it('htmlForとidの関連付けが正しい', () => {
    render(
      <NotificationSettingsForm setting={mockSetting} onSave={mockOnSave} isLoading={false} />,
    );

    const reminderLabel = document.querySelector('label[for="reminder-minutes"]');
    const reminderSelect = document.querySelector('#reminder-minutes');
    expect(reminderLabel).toBeTruthy();
    expect(reminderSelect).toBeTruthy();

    const appointmentLabel = document.querySelector('label[for="appointment-days"]');
    const appointmentSelect = document.querySelector('#appointment-days');
    expect(appointmentLabel).toBeTruthy();
    expect(appointmentSelect).toBeTruthy();
  });
});
