import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Frequency Analysis Edge Cases', () => {
  describe('getAppointmentFrequency', () => {
    it('年をまたぐ予約', () => {
      const dates = [new Date(2024, 11, 31), new Date(2025, 0, 1)];
      const result = AppointmentEntity.getAppointmentFrequency(dates);
      expect(result['2024-12']).toBe(1);
      expect(result['2025-01']).toBe(1);
    });

    it('同日の複数予約', () => {
      const dates = [new Date(2025, 5, 15), new Date(2025, 5, 15)];
      const result = AppointmentEntity.getAppointmentFrequency(dates);
      expect(result['2025-06']).toBe(2);
    });

    it('月のゼロパディング', () => {
      const dates = [new Date(2025, 0, 1)];
      const result = AppointmentEntity.getAppointmentFrequency(dates);
      expect(result['2025-01']).toBe(1);
    });
  });

  describe('getFrequencyTrend', () => {
    it('同数は安定', () => {
      const monthly = { '2025-01': 2, '2025-02': 2 };
      expect(AppointmentEntity.getFrequencyTrend(monthly)).toBe('stable');
    });

    it('1→2は増加', () => {
      const monthly = { '2025-01': 1, '2025-02': 2 };
      expect(AppointmentEntity.getFrequencyTrend(monthly)).toBe('increasing');
    });

    it('月が非連続でもソートして比較', () => {
      const monthly = { '2025-03': 3, '2025-01': 1 };
      expect(AppointmentEntity.getFrequencyTrend(monthly)).toBe('increasing');
    });
  });

  describe('getAppointmentDensityLabel', () => {
    it('境界値3は定期的', () => {
      expect(AppointmentEntity.getAppointmentDensityLabel(3)).toBe('定期的');
    });

    it('境界値4は頻繁', () => {
      expect(AppointmentEntity.getAppointmentDensityLabel(4)).toBe('頻繁');
    });

    it('負の値はなし', () => {
      expect(AppointmentEntity.getAppointmentDensityLabel(-1)).toBe('なし');
    });

    it('大きな値は頻繁', () => {
      expect(AppointmentEntity.getAppointmentDensityLabel(100)).toBe('頻繁');
    });
  });
});
