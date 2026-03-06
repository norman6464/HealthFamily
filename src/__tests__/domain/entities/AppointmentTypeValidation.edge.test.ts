import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity 予約種別バリデーション エッジケース', () => {
  describe('validateAppointmentType', () => {
    it('大文字のCHECKUPは無効', () => {
      expect(AppointmentEntity.validateAppointmentType('CHECKUP')).toBe(false);
    });

    it('otherは有効', () => {
      expect(AppointmentEntity.validateAppointmentType('other')).toBe(true);
    });
  });

  describe('getAllAppointmentTypes', () => {
    it('otherを含む', () => {
      const types = AppointmentEntity.getAllAppointmentTypes();
      expect(types.some((t) => t.id === 'other')).toBe(true);
    });
  });

  describe('getTypeDisplayInfo', () => {
    it('otherの表示情報はisValidがtrue', () => {
      const info = AppointmentEntity.getTypeDisplayInfo('other');
      expect(info.isValid).toBe(true);
      expect(info.label).toBe('その他');
    });

    it('空文字は無効な種別として扱う', () => {
      const info = AppointmentEntity.getTypeDisplayInfo('');
      expect(info.label).toBe('');
      expect(info.isValid).toBe(true);
    });
  });
});
