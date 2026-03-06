import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStats マイルストーン計算', () => {
  describe('getNextMilestone', () => {
    it('0日の場合は7を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(0)).toBe(7);
    });

    it('5日の場合は7を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(5)).toBe(7);
    });

    it('7日の場合は14を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(7)).toBe(14);
    });

    it('14日の場合は30を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(14)).toBe(30);
    });

    it('30日の場合は60を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(30)).toBe(60);
    });

    it('90日の場合は100を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(90)).toBe(100);
    });

    it('100日の場合は180を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(100)).toBe(180);
    });

    it('180日の場合は365を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(180)).toBe(365);
    });

    it('365日以上の場合はnullを返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(365)).toBeNull();
    });

    it('400日の場合はnullを返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(400)).toBeNull();
    });
  });

  describe('getDaysUntilMilestone', () => {
    it('0日の場合は7を返す', () => {
      expect(AdherenceStatsEntity.getDaysUntilMilestone(0)).toBe(7);
    });

    it('5日の場合は2を返す', () => {
      expect(AdherenceStatsEntity.getDaysUntilMilestone(5)).toBe(2);
    });

    it('7日ちょうどの場合は次のマイルストーンまでの日数を返す', () => {
      expect(AdherenceStatsEntity.getDaysUntilMilestone(7)).toBe(7);
    });

    it('365日以上の場合はnullを返す', () => {
      expect(AdherenceStatsEntity.getDaysUntilMilestone(365)).toBeNull();
    });
  });

  describe('getMilestoneAchievementMessage', () => {
    it('7日達成メッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMilestoneAchievementMessage(7);
      expect(msg).toContain('1週間');
    });

    it('14日達成メッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMilestoneAchievementMessage(14);
      expect(msg).toContain('2週間');
    });

    it('30日達成メッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMilestoneAchievementMessage(30);
      expect(msg).toContain('1ヶ月');
    });

    it('365日達成メッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMilestoneAchievementMessage(365);
      expect(msg).toContain('1年');
    });

    it('マイルストーンでない日数はnullを返す', () => {
      expect(AdherenceStatsEntity.getMilestoneAchievementMessage(5)).toBeNull();
    });

    it('10日はマイルストーンでないのでnullを返す', () => {
      expect(AdherenceStatsEntity.getMilestoneAchievementMessage(10)).toBeNull();
    });
  });
});
