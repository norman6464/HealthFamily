import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Comparison Summary Edge Cases', () => {
  describe('getMemberComparisonSummary', () => {
    it('全員同じ率', () => {
      const members = [
        { name: '太郎', adherenceRate: 80 },
        { name: '花子', adherenceRate: 80 },
      ];
      const result = MemberEntity.getMemberComparisonSummary(members);
      expect(result!.averageRate).toBe(80);
    });

    it('0%のメンバーがいる場合', () => {
      const members = [
        { name: '太郎', adherenceRate: 100 },
        { name: '花子', adherenceRate: 0 },
      ];
      const result = MemberEntity.getMemberComparisonSummary(members);
      expect(result!.bestMember).toBe('太郎');
      expect(result!.worstMember).toBe('花子');
      expect(result!.averageRate).toBe(50);
    });

    it('多数メンバー', () => {
      const members = [
        { name: 'A', adherenceRate: 90 },
        { name: 'B', adherenceRate: 70 },
        { name: 'C', adherenceRate: 80 },
        { name: 'D', adherenceRate: 60 },
        { name: 'E', adherenceRate: 100 },
      ];
      const result = MemberEntity.getMemberComparisonSummary(members);
      expect(result!.bestMember).toBe('E');
      expect(result!.worstMember).toBe('D');
      expect(result!.averageRate).toBe(80);
    });
  });

  describe('getComparisonMessage', () => {
    it('差が20の境界', () => {
      expect(MemberEntity.getComparisonMessage(90, 70)).toBe('メンバー間で差があります');
    });

    it('差が19の境界', () => {
      expect(MemberEntity.getComparisonMessage(90, 71)).toBe('メンバー全体で安定しています');
    });

    it('差が0', () => {
      expect(MemberEntity.getComparisonMessage(100, 100)).toBe('メンバー全体で安定しています');
    });
  });
});
