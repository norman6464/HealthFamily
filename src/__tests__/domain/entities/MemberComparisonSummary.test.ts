import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Comparison Summary', () => {
  describe('getMemberComparisonSummary', () => {
    it('複数メンバーの比較サマリーを生成', () => {
      const members = [
        { name: '太郎', adherenceRate: 90 },
        { name: '花子', adherenceRate: 70 },
        { name: '次郎', adherenceRate: 80 },
      ];
      const result = MemberEntity.getMemberComparisonSummary(members);
      expect(result.bestMember).toBe('太郎');
      expect(result.worstMember).toBe('花子');
      expect(result.averageRate).toBe(80);
    });

    it('1人の場合はその人がベスト・ワースト', () => {
      const members = [{ name: '太郎', adherenceRate: 85 }];
      const result = MemberEntity.getMemberComparisonSummary(members);
      expect(result.bestMember).toBe('太郎');
      expect(result.worstMember).toBe('太郎');
      expect(result.averageRate).toBe(85);
    });

    it('空配列はnull', () => {
      expect(MemberEntity.getMemberComparisonSummary([])).toBeNull();
    });
  });

  describe('getComparisonMessage', () => {
    it('差が大きい場合', () => {
      expect(MemberEntity.getComparisonMessage(90, 50)).toBe('メンバー間で差があります');
    });

    it('差が小さい場合', () => {
      expect(MemberEntity.getComparisonMessage(85, 80)).toBe('メンバー全体で安定しています');
    });

    it('同じ場合', () => {
      expect(MemberEntity.getComparisonMessage(80, 80)).toBe('メンバー全体で安定しています');
    });
  });
});
