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

describe('ManageNotificationSettings', () => {
  let mockRepository: NotificationSettingRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
  });

  describe('GetNotificationSetting', () => {
    it('通知設定を取得できる', async () => {
      vi.mocked(mockRepository.get).mockResolvedValue(mockSetting);

      const useCase = new GetNotificationSetting(mockRepository);
      const result = await useCase.execute();

      expect(result).toEqual(mockSetting);
      expect(mockRepository.get).toHaveBeenCalledOnce();
    });

    it('設定が存在しない場合はnullを返す', async () => {
      vi.mocked(mockRepository.get).mockResolvedValue(null);

      const useCase = new GetNotificationSetting(mockRepository);
      const result = await useCase.execute();

      expect(result).toBeNull();
    });
  });

  describe('UpdateNotificationSetting', () => {
    it('通知設定を更新できる', async () => {
      const input: UpdateNotificationSettingInput = {
        medicationReminderEnabled: false,
        defaultReminderMinutesBefore: 15,
      };
      const updatedSetting: NotificationSetting = {
        ...mockSetting,
        ...input,
      };
      vi.mocked(mockRepository.upsert).mockResolvedValue(updatedSetting);

      const useCase = new UpdateNotificationSetting(mockRepository);
      const result = await useCase.execute(input);

      expect(result.medicationReminderEnabled).toBe(false);
      expect(result.defaultReminderMinutesBefore).toBe(15);
      expect(mockRepository.upsert).toHaveBeenCalledWith(input);
    });

    it('メール通知を無効にできる', async () => {
      const input: UpdateNotificationSettingInput = {
        emailNotificationEnabled: false,
      };
      const updatedSetting: NotificationSetting = {
        ...mockSetting,
        emailNotificationEnabled: false,
      };
      vi.mocked(mockRepository.upsert).mockResolvedValue(updatedSetting);

      const useCase = new UpdateNotificationSetting(mockRepository);
      const result = await useCase.execute(input);

      expect(result.emailNotificationEnabled).toBe(false);
    });

    it('リマインダー分数が負の場合エラー', async () => {
      const input: UpdateNotificationSettingInput = {
        defaultReminderMinutesBefore: -1,
      };

      const useCase = new UpdateNotificationSetting(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('リマインダー時間は0以上で指定してください');
    });

    it('予約リマインダー日数が負の場合エラー', async () => {
      const input: UpdateNotificationSettingInput = {
        defaultAppointmentReminderDaysBefore: -1,
      };

      const useCase = new UpdateNotificationSetting(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('リマインダー日数は0以上で指定してください');
    });
  });
});
