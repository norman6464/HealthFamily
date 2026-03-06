import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Time Period Distribution', () => {
  describe('getTimePeriodDistribution', () => {
    it('時間帯別にスケジュール数を集計', () => {
      const times = ['06:00', '08:00', '13:00', '18:00', '22:00'];
      const result = ScheduleEntity.getTimePeriodDistribution(times);
      expect(result.morning).toBe(2);
      expect(result.afternoon).toBe(1);
      expect(result.evening).toBe(1);
      expect(result.night).toBe(1);
    });

    it('空配列は全て0', () => {
      const result = ScheduleEntity.getTimePeriodDistribution([]);
      expect(result.morning).toBe(0);
      expect(result.afternoon).toBe(0);
      expect(result.evening).toBe(0);
      expect(result.night).toBe(0);
    });

    it('全て朝の場合', () => {
      const times = ['05:00', '07:00', '09:00', '11:00'];
      const result = ScheduleEntity.getTimePeriodDistribution(times);
      expect(result.morning).toBe(4);
      expect(result.afternoon).toBe(0);
    });

    it('境界値テスト: 5時は朝', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['05:00']);
      expect(result.morning).toBe(1);
    });

    it('境界値テスト: 12時は午後', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['12:00']);
      expect(result.afternoon).toBe(1);
    });

    it('境界値テスト: 17時は夕方', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['17:00']);
      expect(result.evening).toBe(1);
    });

    it('境界値テスト: 21時は夜', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['21:00']);
      expect(result.night).toBe(1);
    });
  });

  describe('getTimePeriodDistributionLabel', () => {
    it('均等分布', () => {
      const dist = { morning: 2, afternoon: 2, evening: 2, night: 2 };
      expect(ScheduleEntity.getTimePeriodDistributionLabel(dist)).toBe('均等');
    });

    it('朝に集中', () => {
      const dist = { morning: 8, afternoon: 1, evening: 1, night: 0 };
      expect(ScheduleEntity.getTimePeriodDistributionLabel(dist)).toBe('朝に集中');
    });

    it('午後に集中', () => {
      const dist = { morning: 0, afternoon: 8, evening: 1, night: 1 };
      expect(ScheduleEntity.getTimePeriodDistributionLabel(dist)).toBe('午後に集中');
    });

    it('夕方に集中', () => {
      const dist = { morning: 1, afternoon: 0, evening: 8, night: 1 };
      expect(ScheduleEntity.getTimePeriodDistributionLabel(dist)).toBe('夕方に集中');
    });

    it('夜に集中', () => {
      const dist = { morning: 1, afternoon: 1, evening: 0, night: 8 };
      expect(ScheduleEntity.getTimePeriodDistributionLabel(dist)).toBe('夜に集中');
    });

    it('全て0は均等', () => {
      const dist = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      expect(ScheduleEntity.getTimePeriodDistributionLabel(dist)).toBe('均等');
    });
  });
});
