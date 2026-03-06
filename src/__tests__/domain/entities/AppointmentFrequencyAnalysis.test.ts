import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Frequency Analysis', () => {
  describe('getAppointmentFrequency', () => {
    it('月別に予約件数を集計', () => {
      const dates = [
        new Date(2025, 0, 10),
        new Date(2025, 0, 20),
        new Date(2025, 1, 15),
        new Date(2025, 2, 5),
      ];
      const result = AppointmentEntity.getAppointmentFrequency(dates);
      expect(result['2025-01']).toBe(2);
      expect(result['2025-02']).toBe(1);
      expect(result['2025-03']).toBe(1);
    });

    it('空配列は空オブジェクト', () => {
      expect(AppointmentEntity.getAppointmentFrequency([])).toEqual({});
    });

    it('同月の複数予約', () => {
      const dates = [
        new Date(2025, 5, 1),
        new Date(2025, 5, 15),
        new Date(2025, 5, 30),
      ];
      const result = AppointmentEntity.getAppointmentFrequency(dates);
      expect(result['2025-06']).toBe(3);
    });
  });

  describe('getFrequencyTrend', () => {
    it('増加傾向を検出', () => {
      const monthly = { '2025-01': 1, '2025-02': 2, '2025-03': 3 };
      expect(AppointmentEntity.getFrequencyTrend(monthly)).toBe('increasing');
    });

    it('減少傾向を検出', () => {
      const monthly = { '2025-01': 3, '2025-02': 2, '2025-03': 1 };
      expect(AppointmentEntity.getFrequencyTrend(monthly)).toBe('decreasing');
    });

    it('安定を検出', () => {
      const monthly = { '2025-01': 2, '2025-02': 2, '2025-03': 2 };
      expect(AppointmentEntity.getFrequencyTrend(monthly)).toBe('stable');
    });

    it('データ不足はstable', () => {
      expect(AppointmentEntity.getFrequencyTrend({})).toBe('stable');
      expect(AppointmentEntity.getFrequencyTrend({ '2025-01': 1 })).toBe('stable');
    });
  });

  describe('getAppointmentDensityLabel', () => {
    it('月4回以上は頻繁', () => {
      expect(AppointmentEntity.getAppointmentDensityLabel(4)).toBe('頻繁');
    });

    it('月2回は定期的', () => {
      expect(AppointmentEntity.getAppointmentDensityLabel(2)).toBe('定期的');
    });

    it('月1回は少なめ', () => {
      expect(AppointmentEntity.getAppointmentDensityLabel(1)).toBe('少なめ');
    });

    it('月0回はなし', () => {
      expect(AppointmentEntity.getAppointmentDensityLabel(0)).toBe('なし');
    });
  });
});
