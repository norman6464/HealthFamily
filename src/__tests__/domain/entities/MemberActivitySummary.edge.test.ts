import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Activity Summary Edge Cases', () => {
  describe('getActivityLevel', () => {
    it('境界値0.8でhigh', () => {
      expect(MemberEntity.getActivityLevel(80, 100)).toBe('high');
    });

    it('境界値0.79でmedium', () => {
      expect(MemberEntity.getActivityLevel(79, 100)).toBe('medium');
    });

    it('境界値0.5でmedium', () => {
      expect(MemberEntity.getActivityLevel(50, 100)).toBe('medium');
    });

    it('境界値0.49でlow', () => {
      expect(MemberEntity.getActivityLevel(49, 100)).toBe('low');
    });

    it('recordDaysがtotalDaysを超える場合はhigh', () => {
      expect(MemberEntity.getActivityLevel(35, 30)).toBe('high');
    });

    it('負のrecordDaysはinactive', () => {
      expect(MemberEntity.getActivityLevel(-1, 30)).toBe('inactive');
    });

    it('1日中1日記録はhigh', () => {
      expect(MemberEntity.getActivityLevel(1, 1)).toBe('high');
    });
  });

  describe('getMemberSummaryMessage', () => {
    it('low活動メンバーのサマリー', () => {
      const result = MemberEntity.getMemberSummaryMessage('タロウ', 'low', 30);
      expect(result).toContain('タロウ');
      expect(result).toContain('30');
    });

    it('名前に特殊文字を含む場合', () => {
      const result = MemberEntity.getMemberSummaryMessage('ポチ（犬）', 'high', 100);
      expect(result).toContain('ポチ（犬）');
    });

    it('服薬率0%の場合', () => {
      const result = MemberEntity.getMemberSummaryMessage('花子', 'inactive', 0);
      expect(result).toContain('花子');
    });
  });
});
