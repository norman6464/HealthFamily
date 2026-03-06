import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Activity Score', () => {
  describe('getMemberActivityScore', () => {
    it('毎日記録ありは100', () => {
      const dailyRecordCounts = [3, 2, 1, 4, 2, 3, 1];
      expect(MemberEntity.getMemberActivityScore(dailyRecordCounts)).toBe(100);
    });

    it('半分記録ありは約50', () => {
      const dailyRecordCounts = [3, 0, 1, 0, 2, 0, 1];
      const score = MemberEntity.getMemberActivityScore(dailyRecordCounts);
      expect(score).toBeCloseTo(57, 0);
    });

    it('全て0は0', () => {
      expect(MemberEntity.getMemberActivityScore([0, 0, 0])).toBe(0);
    });

    it('空配列は0', () => {
      expect(MemberEntity.getMemberActivityScore([])).toBe(0);
    });

    it('1日のみ記録あり', () => {
      expect(MemberEntity.getMemberActivityScore([5])).toBe(100);
    });
  });

  describe('getActivityScoreLabel', () => {
    it('80以上は活発', () => {
      expect(MemberEntity.getActivityScoreLabel(80)).toBe('活発');
    });

    it('50以上は普通', () => {
      expect(MemberEntity.getActivityScoreLabel(50)).toBe('普通');
    });

    it('20以上は低調', () => {
      expect(MemberEntity.getActivityScoreLabel(20)).toBe('低調');
    });

    it('20未満は非活動', () => {
      expect(MemberEntity.getActivityScoreLabel(19)).toBe('非活動');
    });
  });
});
