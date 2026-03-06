import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStats マイルストーン エッジケース', () => {
  describe('getNextMilestone', () => {
    it('6日の場合は7を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(6)).toBe(7);
    });

    it('59日の場合は60を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(59)).toBe(60);
    });

    it('99日の場合は100を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(99)).toBe(100);
    });

    it('364日の場合は365を返す', () => {
      expect(AdherenceStatsEntity.getNextMilestone(364)).toBe(365);
    });
  });

  describe('getDaysUntilMilestone', () => {
    it('6日の場合は残り1日', () => {
      expect(AdherenceStatsEntity.getDaysUntilMilestone(6)).toBe(1);
    });

    it('13日の場合は残り1日', () => {
      expect(AdherenceStatsEntity.getDaysUntilMilestone(13)).toBe(1);
    });

    it('29日の場合は残り1日', () => {
      expect(AdherenceStatsEntity.getDaysUntilMilestone(29)).toBe(1);
    });
  });

  describe('getMilestoneAchievementMessage', () => {
    it('60日達成メッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMilestoneAchievementMessage(60);
      expect(msg).toContain('2ヶ月');
    });

    it('90日達成メッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMilestoneAchievementMessage(90);
      expect(msg).toContain('3ヶ月');
    });

    it('180日達成メッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMilestoneAchievementMessage(180);
      expect(msg).toContain('半年');
    });

    it('1日はマイルストーンでない', () => {
      expect(AdherenceStatsEntity.getMilestoneAchievementMessage(1)).toBeNull();
    });

    it('0日はマイルストーンでない', () => {
      expect(AdherenceStatsEntity.getMilestoneAchievementMessage(0)).toBeNull();
    });
  });
});
