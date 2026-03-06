import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Score Comparison', () => {
  describe('compareMemberScores', () => {
    it('スコアの差を算出', () => {
      const result = MemberEntity.compareMemberScores(90, 70);
      expect(result.difference).toBe(20);
      expect(result.higherLabel).toBe('高い');
    });

    it('同じスコア', () => {
      const result = MemberEntity.compareMemberScores(80, 80);
      expect(result.difference).toBe(0);
      expect(result.higherLabel).toBe('同じ');
    });

    it('低いスコアの場合', () => {
      const result = MemberEntity.compareMemberScores(50, 80);
      expect(result.difference).toBe(-30);
      expect(result.higherLabel).toBe('低い');
    });
  });

  describe('getMemberRankingLabel', () => {
    it('1位', () => {
      expect(MemberEntity.getMemberRankingLabel(1)).toBe('1位');
    });

    it('2位', () => {
      expect(MemberEntity.getMemberRankingLabel(2)).toBe('2位');
    });

    it('10位', () => {
      expect(MemberEntity.getMemberRankingLabel(10)).toBe('10位');
    });

    it('0以下はランク外', () => {
      expect(MemberEntity.getMemberRankingLabel(0)).toBe('ランク外');
    });
  });
});
