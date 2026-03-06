import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Score Comparison Edge Cases', () => {
  describe('compareMemberScores', () => {
    it('非常に大きいスコア差', () => {
      const result = MemberEntity.compareMemberScores(100, 0);
      expect(result.difference).toBe(100);
      expect(result.higherLabel).toBe('高い');
    });

    it('負のスコア', () => {
      const result = MemberEntity.compareMemberScores(-10, -20);
      expect(result.difference).toBe(10);
      expect(result.higherLabel).toBe('高い');
    });

    it('小数点スコア', () => {
      const result = MemberEntity.compareMemberScores(85.5, 85.3);
      expect(result.difference).toBeCloseTo(0.2);
      expect(result.higherLabel).toBe('高い');
    });

    it('0と0の比較', () => {
      const result = MemberEntity.compareMemberScores(0, 0);
      expect(result.difference).toBe(0);
      expect(result.higherLabel).toBe('同じ');
    });

    it('逆順でも正しい符号', () => {
      const result = MemberEntity.compareMemberScores(30, 70);
      expect(result.difference).toBe(-40);
      expect(result.higherLabel).toBe('低い');
    });
  });

  describe('getMemberRankingLabel', () => {
    it('負の数はランク外', () => {
      expect(MemberEntity.getMemberRankingLabel(-1)).toBe('ランク外');
    });

    it('大きな順位', () => {
      expect(MemberEntity.getMemberRankingLabel(100)).toBe('100位');
    });

    it('1位の境界', () => {
      expect(MemberEntity.getMemberRankingLabel(1)).toBe('1位');
    });

    it('0の境界', () => {
      expect(MemberEntity.getMemberRankingLabel(0)).toBe('ランク外');
    });
  });
});
