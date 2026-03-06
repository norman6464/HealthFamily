import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberProfileUtils エッジケース', () => {
  describe('calculateAge エッジケース', () => {
    it('生まれた日は0歳', () => {
      expect(MemberEntity.calculateAge(new Date('2026-03-05'), new Date('2026-03-05'))).toBe(0);
    });

    it('翌日は0歳', () => {
      expect(MemberEntity.calculateAge(new Date('2026-03-04'), new Date('2026-03-05'))).toBe(0);
    });

    it('1年後の誕生日前日は0歳', () => {
      expect(MemberEntity.calculateAge(new Date('2025-03-06'), new Date('2026-03-05'))).toBe(0);
    });

    it('閏年の2月29日生まれ', () => {
      expect(MemberEntity.calculateAge(new Date('2024-02-29'), new Date('2026-03-01'))).toBe(2);
    });
  });

  describe('getProfileSummary エッジケース', () => {
    it('年齢0歳の表示', () => {
      expect(MemberEntity.getProfileSummary('human', 0)).toBe('家族 (0歳)');
    });

    it('ペットタイプotherの表示', () => {
      expect(MemberEntity.getProfileSummary('pet', 5, 'other')).toBe('ペット - その他 (5歳)');
    });
  });
});
