import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Activity Score Edge Cases', () => {
  describe('getMemberActivityScore', () => {
    it('大量データ30日分', () => {
      const data = Array.from({ length: 30 }, (_, i) => (i < 24 ? 1 : 0));
      expect(MemberEntity.getMemberActivityScore(data)).toBe(80);
    });

    it('全て1件ずつは100', () => {
      expect(MemberEntity.getMemberActivityScore([1, 1, 1, 1, 1])).toBe(100);
    });
  });

  describe('getActivityScoreLabel', () => {
    it('境界値80は活発', () => {
      expect(MemberEntity.getActivityScoreLabel(80)).toBe('活発');
    });

    it('境界値79は普通', () => {
      expect(MemberEntity.getActivityScoreLabel(79)).toBe('普通');
    });

    it('境界値50は普通', () => {
      expect(MemberEntity.getActivityScoreLabel(50)).toBe('普通');
    });

    it('境界値49は低調', () => {
      expect(MemberEntity.getActivityScoreLabel(49)).toBe('低調');
    });

    it('境界値20は低調', () => {
      expect(MemberEntity.getActivityScoreLabel(20)).toBe('低調');
    });

    it('境界値19は非活動', () => {
      expect(MemberEntity.getActivityScoreLabel(19)).toBe('非活動');
    });

    it('0は非活動', () => {
      expect(MemberEntity.getActivityScoreLabel(0)).toBe('非活動');
    });

    it('100は活発', () => {
      expect(MemberEntity.getActivityScoreLabel(100)).toBe('活発');
    });
  });
});
