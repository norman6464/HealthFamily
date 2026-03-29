import { describe, it, expect } from 'vitest';
import {
  NotificationSetting,
  createNotificationSetting,
  isNotificationEnabled,
  getDefaultReminderMinutes,
  NOTIFICATION_TYPES,
  NotificationType,
} from '../../../domain/entities/NotificationSetting';

describe('NotificationSetting エッジケース', () => {
  describe('isNotificationEnabled - 全組み合わせ', () => {
    const types: NotificationType[] = [
      'medication_reminder',
      'missed_medication',
      'appointment_reminder',
      'low_stock',
    ];
    const fieldMap: Record<NotificationType, keyof NotificationSetting> = {
      medication_reminder: 'medicationReminderEnabled',
      missed_medication: 'missedMedicationEnabled',
      appointment_reminder: 'appointmentReminderEnabled',
      low_stock: 'lowStockAlertEnabled',
    };

    const baseSetting: NotificationSetting = {
      id: 'ns-1',
      userId: 'user-1',
      medicationReminderEnabled: true,
      missedMedicationEnabled: true,
      appointmentReminderEnabled: true,
      lowStockAlertEnabled: true,
      defaultReminderMinutesBefore: 5,
      defaultAppointmentReminderDaysBefore: 1,
      emailNotificationEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it.each(types)('メール有効・%s有効 → true', (type) => {
      expect(isNotificationEnabled(baseSetting, type)).toBe(true);
    });

    it.each(types)('メール無効 → %s は常にfalse', (type) => {
      const setting = { ...baseSetting, emailNotificationEnabled: false };
      expect(isNotificationEnabled(setting, type)).toBe(false);
    });

    it.each(types)('メール有効・%s無効 → false', (type) => {
      const field = fieldMap[type];
      const setting = { ...baseSetting, [field]: false };
      expect(isNotificationEnabled(setting, type)).toBe(false);
    });
  });

  describe('createNotificationSetting', () => {
    it('全フィールドをオーバーライドできる', () => {
      const setting = createNotificationSetting('user-1', {
        medicationReminderEnabled: false,
        missedMedicationEnabled: false,
        appointmentReminderEnabled: false,
        lowStockAlertEnabled: false,
        defaultReminderMinutesBefore: 60,
        defaultAppointmentReminderDaysBefore: 7,
        emailNotificationEnabled: false,
      });

      expect(setting.medicationReminderEnabled).toBe(false);
      expect(setting.missedMedicationEnabled).toBe(false);
      expect(setting.appointmentReminderEnabled).toBe(false);
      expect(setting.lowStockAlertEnabled).toBe(false);
      expect(setting.defaultReminderMinutesBefore).toBe(60);
      expect(setting.defaultAppointmentReminderDaysBefore).toBe(7);
      expect(setting.emailNotificationEnabled).toBe(false);
    });

    it('userIdが正しく設定される', () => {
      const setting = createNotificationSetting('test-user-123');
      expect(setting.userId).toBe('test-user-123');
    });
  });

  describe('getDefaultReminderMinutes', () => {
    it('0分を返す設定', () => {
      const setting: NotificationSetting = {
        id: 'ns-1',
        userId: 'user-1',
        medicationReminderEnabled: true,
        missedMedicationEnabled: true,
        appointmentReminderEnabled: true,
        lowStockAlertEnabled: true,
        defaultReminderMinutesBefore: 0,
        defaultAppointmentReminderDaysBefore: 0,
        emailNotificationEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(getDefaultReminderMinutes(setting)).toBe(0);
    });
  });

  describe('NOTIFICATION_TYPES', () => {
    it('全ての通知タイプキーがユニーク', () => {
      const keys = NOTIFICATION_TYPES.map((t) => t.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('通知タイプのラベルが日本語', () => {
      NOTIFICATION_TYPES.forEach((type) => {
        expect(type.label).toMatch(/[\u3040-\u9FFF]/);
        expect(type.description).toMatch(/[\u3040-\u9FFF]/);
      });
    });
  });
});
