import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity 予約種別バリデーション', () => {
  describe('validateAppointmentType', () => {
    it('checkupは有効', () => {
      expect(AppointmentEntity.validateAppointmentType('checkup')).toBe(true);
    });

    it('treatmentは有効', () => {
      expect(AppointmentEntity.validateAppointmentType('treatment')).toBe(true);
    });

    it('vaccinationは有効', () => {
      expect(AppointmentEntity.validateAppointmentType('vaccination')).toBe(true);
    });

    it('unknownは無効', () => {
      expect(AppointmentEntity.validateAppointmentType('unknown')).toBe(false);
    });

    it('空文字は無効', () => {
      expect(AppointmentEntity.validateAppointmentType('')).toBe(false);
    });
  });

  describe('getAllAppointmentTypes', () => {
    it('全種別を返す', () => {
      const types = AppointmentEntity.getAllAppointmentTypes();
      expect(types.length).toBeGreaterThanOrEqual(4);
    });

    it('各種別にidとlabelがある', () => {
      const types = AppointmentEntity.getAllAppointmentTypes();
      for (const t of types) {
        expect(t.id).toBeTruthy();
        expect(t.label).toBeTruthy();
      }
    });

    it('checkupを含む', () => {
      const types = AppointmentEntity.getAllAppointmentTypes();
      expect(types.some((t) => t.id === 'checkup')).toBe(true);
    });
  });

  describe('getTypeDisplayInfo', () => {
    it('checkupの表示情報を返す', () => {
      const info = AppointmentEntity.getTypeDisplayInfo('checkup');
      expect(info.label).toBe('定期検診');
      expect(info.isValid).toBe(true);
    });

    it('未知の種別のisValidはfalse', () => {
      const info = AppointmentEntity.getTypeDisplayInfo('unknown');
      expect(info.isValid).toBe(false);
    });

    it('未知の種別のlabelはそのまま返す', () => {
      const info = AppointmentEntity.getTypeDisplayInfo('custom');
      expect(info.label).toBe('custom');
    });

    it('undefinedの場合は空ラベルを返す', () => {
      const info = AppointmentEntity.getTypeDisplayInfo(undefined);
      expect(info.label).toBe('');
      expect(info.isValid).toBe(true);
    });
  });
});
