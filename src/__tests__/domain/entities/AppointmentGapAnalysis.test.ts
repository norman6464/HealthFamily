import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Gap Analysis', () => {
  describe('getAppointmentGapAnalysis', () => {
    it('均等な間隔', () => {
      const intervals = [30, 30, 30];
      const result = AppointmentEntity.getAppointmentGapAnalysis(intervals);
      expect(result.maxGap).toBe(30);
      expect(result.minGap).toBe(30);
      expect(result.averageGap).toBe(30);
    });

    it('不均等な間隔', () => {
      const intervals = [10, 50, 20];
      const result = AppointmentEntity.getAppointmentGapAnalysis(intervals);
      expect(result.maxGap).toBe(50);
      expect(result.minGap).toBe(10);
    });

    it('空配列', () => {
      const result = AppointmentEntity.getAppointmentGapAnalysis([]);
      expect(result.maxGap).toBe(0);
      expect(result.minGap).toBe(0);
      expect(result.averageGap).toBe(0);
    });

    it('1件のみ', () => {
      const result = AppointmentEntity.getAppointmentGapAnalysis([14]);
      expect(result.maxGap).toBe(14);
      expect(result.minGap).toBe(14);
      expect(result.averageGap).toBe(14);
    });
  });

  describe('getGapAnalysisLabel', () => {
    it('最大と最小の差が小さいと規則的', () => {
      expect(AppointmentEntity.getGapAnalysisLabel(30, 28)).toBe('規則的');
    });

    it('差が中程度はやや不規則', () => {
      expect(AppointmentEntity.getGapAnalysisLabel(40, 20)).toBe('やや不規則');
    });

    it('差が大きいと不規則', () => {
      expect(AppointmentEntity.getGapAnalysisLabel(60, 10)).toBe('不規則');
    });
  });
});
