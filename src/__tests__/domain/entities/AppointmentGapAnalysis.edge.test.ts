import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Gap Analysis Edge Cases', () => {
  describe('getAppointmentGapAnalysis', () => {
    it('全て同じ間隔', () => {
      const result = AppointmentEntity.getAppointmentGapAnalysis([14, 14, 14]);
      expect(result.maxGap).toBe(14);
      expect(result.minGap).toBe(14);
      expect(result.averageGap).toBe(14);
    });

    it('極端な差がある間隔', () => {
      const result = AppointmentEntity.getAppointmentGapAnalysis([1, 365]);
      expect(result.maxGap).toBe(365);
      expect(result.minGap).toBe(1);
      expect(result.averageGap).toBe(183);
    });

    it('0日間隔を含む', () => {
      const result = AppointmentEntity.getAppointmentGapAnalysis([0, 30]);
      expect(result.minGap).toBe(0);
    });
  });

  describe('getGapAnalysisLabel', () => {
    it('差が7は規則的', () => {
      expect(AppointmentEntity.getGapAnalysisLabel(37, 30)).toBe('規則的');
    });

    it('差が8はやや不規則', () => {
      expect(AppointmentEntity.getGapAnalysisLabel(38, 30)).toBe('やや不規則');
    });

    it('差が30はやや不規則', () => {
      expect(AppointmentEntity.getGapAnalysisLabel(60, 30)).toBe('やや不規則');
    });

    it('差が31は不規則', () => {
      expect(AppointmentEntity.getGapAnalysisLabel(61, 30)).toBe('不規則');
    });

    it('差が0は規則的', () => {
      expect(AppointmentEntity.getGapAnalysisLabel(30, 30)).toBe('規則的');
    });
  });
});
