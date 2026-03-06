import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity 年齢グループ エッジケース', () => {
  describe('getAgeGroup', () => {
    it('境界値6歳はchildを返す', () => {
      expect(MemberEntity.getAgeGroup(6)).toBe('child');
    });

    it('境界値18歳はadultを返す', () => {
      expect(MemberEntity.getAgeGroup(18)).toBe('adult');
    });

    it('境界値65歳はseniorを返す', () => {
      expect(MemberEntity.getAgeGroup(65)).toBe('senior');
    });

    it('非常に高齢（120歳）はseniorを返す', () => {
      expect(MemberEntity.getAgeGroup(120)).toBe('senior');
    });
  });

  describe('getAgeDisplayLabel', () => {
    it('100歳は100歳を返す', () => {
      expect(MemberEntity.getAgeDisplayLabel(100)).toBe('100歳');
    });
  });

  describe('validateBirthDate', () => {
    it('1日後の未来日は無効', () => {
      const tomorrow = new Date('2025-06-16');
      const today = new Date('2025-06-15');
      const result = MemberEntity.validateBirthDate(tomorrow, today);
      expect(result.valid).toBe(false);
    });

    it('100年以上前の日付も有効', () => {
      const oldDate = new Date('1900-01-01');
      const result = MemberEntity.validateBirthDate(oldDate, new Date('2025-01-01'));
      expect(result.valid).toBe(true);
    });
  });
});
