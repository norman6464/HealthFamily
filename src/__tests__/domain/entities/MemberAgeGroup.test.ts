import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity 年齢グループ判定', () => {
  describe('getAgeGroup', () => {
    it('0歳は乳幼児を返す', () => {
      expect(MemberEntity.getAgeGroup(0)).toBe('infant');
    });

    it('5歳は乳幼児を返す', () => {
      expect(MemberEntity.getAgeGroup(5)).toBe('infant');
    });

    it('6歳は子供を返す', () => {
      expect(MemberEntity.getAgeGroup(6)).toBe('child');
    });

    it('17歳は子供を返す', () => {
      expect(MemberEntity.getAgeGroup(17)).toBe('child');
    });

    it('18歳は大人を返す', () => {
      expect(MemberEntity.getAgeGroup(18)).toBe('adult');
    });

    it('64歳は大人を返す', () => {
      expect(MemberEntity.getAgeGroup(64)).toBe('adult');
    });

    it('65歳はシニアを返す', () => {
      expect(MemberEntity.getAgeGroup(65)).toBe('senior');
    });

    it('nullはunknownを返す', () => {
      expect(MemberEntity.getAgeGroup(null)).toBe('unknown');
    });
  });

  describe('getAgeGroupLabel', () => {
    it('infantは乳幼児を返す', () => {
      expect(MemberEntity.getAgeGroupLabel('infant')).toBe('乳幼児');
    });

    it('childは子供を返す', () => {
      expect(MemberEntity.getAgeGroupLabel('child')).toBe('子供');
    });

    it('adultは大人を返す', () => {
      expect(MemberEntity.getAgeGroupLabel('adult')).toBe('大人');
    });

    it('seniorはシニアを返す', () => {
      expect(MemberEntity.getAgeGroupLabel('senior')).toBe('シニア');
    });

    it('unknownは不明を返す', () => {
      expect(MemberEntity.getAgeGroupLabel('unknown')).toBe('不明');
    });
  });

  describe('getAgeDisplayLabel', () => {
    it('年齢ありの場合は歳付きで返す', () => {
      expect(MemberEntity.getAgeDisplayLabel(25)).toBe('25歳');
    });

    it('0歳の場合は0歳を返す', () => {
      expect(MemberEntity.getAgeDisplayLabel(0)).toBe('0歳');
    });

    it('nullの場合は年齢不明を返す', () => {
      expect(MemberEntity.getAgeDisplayLabel(null)).toBe('年齢不明');
    });
  });

  describe('validateBirthDate', () => {
    it('過去の日付は有効', () => {
      const result = MemberEntity.validateBirthDate(new Date('2000-01-01'), new Date('2025-01-01'));
      expect(result.valid).toBe(true);
    });

    it('未来の日付は無効', () => {
      const result = MemberEntity.validateBirthDate(new Date('2030-01-01'), new Date('2025-01-01'));
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('今日の日付は有効', () => {
      const today = new Date('2025-06-15');
      const result = MemberEntity.validateBirthDate(today, today);
      expect(result.valid).toBe(true);
    });

    it('nullは有効（任意項目）', () => {
      const result = MemberEntity.validateBirthDate(null, new Date('2025-01-01'));
      expect(result.valid).toBe(true);
    });
  });
});
