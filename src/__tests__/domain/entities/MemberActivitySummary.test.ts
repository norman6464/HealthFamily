import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Activity Summary', () => {
  describe('getActivityLevel', () => {
    it('毎日記録があれば高活動', () => {
      expect(MemberEntity.getActivityLevel(30, 30)).toBe('high');
    });

    it('半分以上記録があれば中活動', () => {
      expect(MemberEntity.getActivityLevel(15, 30)).toBe('medium');
    });

    it('少しだけ記録があれば低活動', () => {
      expect(MemberEntity.getActivityLevel(5, 30)).toBe('low');
    });

    it('記録なしはinactive', () => {
      expect(MemberEntity.getActivityLevel(0, 30)).toBe('inactive');
    });

    it('期間0日はinactive', () => {
      expect(MemberEntity.getActivityLevel(5, 0)).toBe('inactive');
    });
  });

  describe('getActivityLevelLabel', () => {
    it('high は 活発', () => {
      expect(MemberEntity.getActivityLevelLabel('high')).toBe('活発');
    });

    it('medium は 普通', () => {
      expect(MemberEntity.getActivityLevelLabel('medium')).toBe('普通');
    });

    it('low は 少なめ', () => {
      expect(MemberEntity.getActivityLevelLabel('low')).toBe('少なめ');
    });

    it('inactive は 記録なし', () => {
      expect(MemberEntity.getActivityLevelLabel('inactive')).toBe('記録なし');
    });
  });

  describe('getMemberSummaryMessage', () => {
    it('高活動メンバーのサマリー', () => {
      const result = MemberEntity.getMemberSummaryMessage('太郎', 'high', 95);
      expect(result).toContain('太郎');
      expect(result).toContain('95');
    });

    it('記録なしメンバーのサマリー', () => {
      const result = MemberEntity.getMemberSummaryMessage('花子', 'inactive', 0);
      expect(result).toContain('花子');
      expect(result).toContain('記録');
    });

    it('中活動メンバーのサマリー', () => {
      const result = MemberEntity.getMemberSummaryMessage('ポチ', 'medium', 60);
      expect(result).toContain('ポチ');
    });
  });
});
