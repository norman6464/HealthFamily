/**
 * サーバーサイド用 通知設定リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  NotificationSettingRepository,
  UpdateNotificationSettingInput,
} from '@/domain/repositories/NotificationSettingRepository';
import { NotificationSetting } from '@/domain/entities/NotificationSetting';

function toNotificationSetting(row: {
  id: string;
  userId: string;
  medicationReminderEnabled: boolean;
  missedMedicationEnabled: boolean;
  appointmentReminderEnabled: boolean;
  lowStockAlertEnabled: boolean;
  defaultReminderMinutesBefore: number;
  defaultAppointmentReminderDaysBefore: number;
  emailNotificationEnabled: boolean;
  lineNotificationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): NotificationSetting {
  return {
    id: row.id,
    userId: row.userId,
    medicationReminderEnabled: row.medicationReminderEnabled,
    missedMedicationEnabled: row.missedMedicationEnabled,
    appointmentReminderEnabled: row.appointmentReminderEnabled,
    lowStockAlertEnabled: row.lowStockAlertEnabled,
    defaultReminderMinutesBefore: row.defaultReminderMinutesBefore,
    defaultAppointmentReminderDaysBefore: row.defaultAppointmentReminderDaysBefore,
    emailNotificationEnabled: row.emailNotificationEnabled,
    lineNotificationEnabled: row.lineNotificationEnabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaNotificationSettingRepository implements NotificationSettingRepository {
  constructor(private readonly userId: string) {}

  async get(): Promise<NotificationSetting | null> {
    const row = await prisma.notificationSetting.findUnique({
      where: { userId: this.userId },
    });
    if (!row) return null;
    return toNotificationSetting(row);
  }

  async upsert(input: UpdateNotificationSettingInput): Promise<NotificationSetting> {
    const data: Record<string, unknown> = {};
    if (input.medicationReminderEnabled !== undefined) data.medicationReminderEnabled = input.medicationReminderEnabled;
    if (input.missedMedicationEnabled !== undefined) data.missedMedicationEnabled = input.missedMedicationEnabled;
    if (input.appointmentReminderEnabled !== undefined) data.appointmentReminderEnabled = input.appointmentReminderEnabled;
    if (input.lowStockAlertEnabled !== undefined) data.lowStockAlertEnabled = input.lowStockAlertEnabled;
    if (input.defaultReminderMinutesBefore !== undefined) data.defaultReminderMinutesBefore = input.defaultReminderMinutesBefore;
    if (input.defaultAppointmentReminderDaysBefore !== undefined) data.defaultAppointmentReminderDaysBefore = input.defaultAppointmentReminderDaysBefore;
    if (input.emailNotificationEnabled !== undefined) data.emailNotificationEnabled = input.emailNotificationEnabled;
    if (input.lineNotificationEnabled !== undefined) data.lineNotificationEnabled = input.lineNotificationEnabled;

    const row = await prisma.notificationSetting.upsert({
      where: { userId: this.userId },
      create: {
        userId: this.userId,
        ...data,
      },
      update: data,
    });
    return toNotificationSetting(row);
  }
}
