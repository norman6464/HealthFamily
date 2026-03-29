import { describe, it, expect } from 'vitest';
import {
  NotificationSetting,
  NotificationType,
  DEFAULT_NOTIFICATION_SETTING,
  createNotificationSetting,
  isNotificationEnabled,
  getDefaultReminderMinutes,
  NOTIFICATION_TYPES,
} from '../../../domain/entities/NotificationSetting';

describe('NotificationSetting Entity', () => {
  const mockSetting: NotificationSetting = {
    id: 'ns-1',
    userId: 'user-1',
    medicationReminderEnabled: true,
    missedMedicationEnabled: true,
    appointmentReminderEnabled: true,
    lowStockAlertEnabled: true,
    defaultReminderMinutesBefore: 10,
    defaultAppointmentReminderDaysBefore: 1,
    emailNotificationEnabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('createNotificationSetting', () => {
    it('デフォルト値で通知設定を作成できる', () => {
      const setting = createNotificationSetting('user-1');

      expect(setting.userId).toBe('user-1');
      expect(setting.medicationReminderEnabled).toBe(true);
      expect(setting.missedMedicationEnabled).toBe(true);
      expect(setting.appointmentReminderEnabled).toBe(true);
      expect(setting.lowStockAlertEnabled).toBe(true);
      expect(setting.defaultReminderMinutesBefore).toBe(5);
      expect(setting.defaultAppointmentReminderDaysBefore).toBe(1);
      expect(setting.emailNotificationEnabled).toBe(true);
    });

    it('カスタム値で通知設定を作成できる', () => {
      const setting = createNotificationSetting('user-1', {
        medicationReminderEnabled: false,
        defaultReminderMinutesBefore: 30,
      });

      expect(setting.medicationReminderEnabled).toBe(false);
      expect(setting.defaultReminderMinutesBefore).toBe(30);
      expect(setting.missedMedicationEnabled).toBe(true);
    });
  });

  describe('isNotificationEnabled', () => {
    it('服薬リマインダーの有効状態を正しく返す', () => {
      expect(isNotificationEnabled(mockSetting, 'medication_reminder')).toBe(true);
    });

    it('飲み忘れ通知の有効状態を正しく返す', () => {
      expect(isNotificationEnabled(mockSetting, 'missed_medication')).toBe(true);
    });

    it('予約リマインダーの有効状態を正しく返す', () => {
      expect(isNotificationEnabled(mockSetting, 'appointment_reminder')).toBe(true);
    });

    it('在庫アラートの有効状態を正しく返す', () => {
      expect(isNotificationEnabled(mockSetting, 'low_stock')).toBe(true);
    });

    it('メール通知が無効の場合は全て無効になる', () => {
      const disabledEmail: NotificationSetting = {
        ...mockSetting,
        emailNotificationEnabled: false,
      };
      expect(isNotificationEnabled(disabledEmail, 'medication_reminder')).toBe(false);
      expect(isNotificationEnabled(disabledEmail, 'missed_medication')).toBe(false);
    });

    it('個別の通知が無効の場合はその通知のみ無効', () => {
      const setting: NotificationSetting = {
        ...mockSetting,
        medicationReminderEnabled: false,
      };
      expect(isNotificationEnabled(setting, 'medication_reminder')).toBe(false);
      expect(isNotificationEnabled(setting, 'missed_medication')).toBe(true);
    });
  });

  describe('getDefaultReminderMinutes', () => {
    it('デフォルトのリマインダー分数を返す', () => {
      expect(getDefaultReminderMinutes(mockSetting)).toBe(10);
    });
  });

  describe('NOTIFICATION_TYPES', () => {
    it('4種類の通知タイプが定義されている', () => {
      expect(NOTIFICATION_TYPES).toHaveLength(4);
    });

    it('全通知タイプにラベルと説明がある', () => {
      NOTIFICATION_TYPES.forEach((type) => {
        expect(type.key).toBeTruthy();
        expect(type.label).toBeTruthy();
        expect(type.description).toBeTruthy();
      });
    });
  });

  describe('DEFAULT_NOTIFICATION_SETTING', () => {
    it('デフォルト値が正しい', () => {
      expect(DEFAULT_NOTIFICATION_SETTING.medicationReminderEnabled).toBe(true);
      expect(DEFAULT_NOTIFICATION_SETTING.missedMedicationEnabled).toBe(true);
      expect(DEFAULT_NOTIFICATION_SETTING.appointmentReminderEnabled).toBe(true);
      expect(DEFAULT_NOTIFICATION_SETTING.lowStockAlertEnabled).toBe(true);
      expect(DEFAULT_NOTIFICATION_SETTING.defaultReminderMinutesBefore).toBe(5);
      expect(DEFAULT_NOTIFICATION_SETTING.defaultAppointmentReminderDaysBefore).toBe(1);
      expect(DEFAULT_NOTIFICATION_SETTING.emailNotificationEnabled).toBe(true);
    });
  });
});
