import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GetNotificationSetting,
  UpdateNotificationSetting,
} from '../../../domain/usecases/ManageNotificationSettings';
import {
  NotificationSettingRepository,
  UpdateNotificationSettingInput,
} from '../../../domain/repositories/NotificationSettingRepository';
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

const createMockRepository = (): NotificationSettingRepository => ({
  get: vi.fn(),
  upsert: vi.fn(),
});

describe('ManageNotificationSettings エッジケース', () => {
  let mockRepository: NotificationSettingRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
  });

  describe('UpdateNotificationSetting 許可値バリデーション', () => {
    const allowedMinutes = [0, 5, 10, 15, 30, 60];
    const allowedDays = [0, 1, 2, 3, 7];

    it.each(allowedMinutes)('リマインダー分数 %d は許可される', async (minutes) => {
      const input: UpdateNotificationSettingInput = {
        defaultReminderMinutesBefore: minutes,
      };
      vi.mocked(mockRepository.upsert).mockResolvedValue({
        ...mockSetting,
        defaultReminderMinutesBefore: minutes,
      });

      const useCase = new UpdateNotificationSetting(mockRepository);
      const result = await useCase.execute(input);

      expect(result.defaultReminderMinutesBefore).toBe(minutes);
    });

    it.each(allowedDays)('リマインダー日数 %d は許可される', async (days) => {
      const input: UpdateNotificationSettingInput = {
        defaultAppointmentReminderDaysBefore: days,
      };
      vi.mocked(mockRepository.upsert).mockResolvedValue({
        ...mockSetting,
        defaultAppointmentReminderDaysBefore: days,
      });

      const useCase = new UpdateNotificationSetting(mockRepository);
      const result = await useCase.execute(input);

      expect(result.defaultAppointmentReminderDaysBefore).toBe(days);
    });

    it.each([1, 2, 3, 4, 6, 7, 8, 20, 45, 90, 120])('リマインダー分数 %d は不正', async (minutes) => {
      const input: UpdateNotificationSettingInput = {
        defaultReminderMinutesBefore: minutes,
      };
      const useCase = new UpdateNotificationSetting(mockRepository);

      if ([0, 5, 10, 15, 30, 60].includes(minutes)) return;
      await expect(useCase.execute(input)).rejects.toThrow('リマインダー時間の値が不正です');
    });

    it.each([4, 5, 6, 8, 10, 14, 30])('リマインダー日数 %d は不正', async (days) => {
      const input: UpdateNotificationSettingInput = {
        defaultAppointmentReminderDaysBefore: days,
      };
      const useCase = new UpdateNotificationSetting(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('リマインダー日数の値が不正です');
    });

    it('全フィールドを同時に更新できる', async () => {
      const input: UpdateNotificationSettingInput = {
        medicationReminderEnabled: false,
        missedMedicationEnabled: false,
        appointmentReminderEnabled: false,
        lowStockAlertEnabled: false,
        defaultReminderMinutesBefore: 30,
        defaultAppointmentReminderDaysBefore: 3,
        emailNotificationEnabled: false,
      };
      const updated = { ...mockSetting, ...input };
      vi.mocked(mockRepository.upsert).mockResolvedValue(updated);

      const useCase = new UpdateNotificationSetting(mockRepository);
      const result = await useCase.execute(input);

      expect(result.medicationReminderEnabled).toBe(false);
      expect(result.emailNotificationEnabled).toBe(false);
      expect(result.defaultReminderMinutesBefore).toBe(30);
      expect(mockRepository.upsert).toHaveBeenCalledWith(input);
    });

    it('空のオブジェクトを渡してもリポジトリが呼ばれる', async () => {
      vi.mocked(mockRepository.upsert).mockResolvedValue(mockSetting);
      const useCase = new UpdateNotificationSetting(mockRepository);
      await useCase.execute({});
      expect(mockRepository.upsert).toHaveBeenCalledWith({});
    });
  });

  describe('GetNotificationSetting', () => {
    it('リポジトリがエラーを返す場合そのまま伝播する', async () => {
      vi.mocked(mockRepository.get).mockRejectedValue(new Error('DB接続エラー'));
      const useCase = new GetNotificationSetting(mockRepository);
      await expect(useCase.execute()).rejects.toThrow('DB接続エラー');
    });
  });
});
