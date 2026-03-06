import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Profile Completeness', () => {
  describe('getProfileCompleteness', () => {
    it('全フィールド入力で100%を返す', () => {
      const member = {
        name: '太郎',
        memberType: 'human' as const,
        birthDate: new Date('1990-01-01'),
        photoUrl: 'https://example.com/photo.jpg',
        notes: 'メモ',
      };
      expect(MemberEntity.getProfileCompleteness(member)).toBe(100);
    });

    it('名前とタイプのみで最低限の完成度を返す', () => {
      const member = {
        name: '太郎',
        memberType: 'human' as const,
      };
      expect(MemberEntity.getProfileCompleteness(member)).toBe(40);
    });

    it('一部入力で中間の完成度を返す', () => {
      const member = {
        name: '太郎',
        memberType: 'human' as const,
        birthDate: new Date('1990-01-01'),
      };
      expect(MemberEntity.getProfileCompleteness(member)).toBe(60);
    });

    it('ペットでpetType入力ありの場合', () => {
      const member = {
        name: 'ポチ',
        memberType: 'pet' as const,
        petType: 'dog' as const,
        birthDate: new Date('2020-01-01'),
        photoUrl: 'https://example.com/pochi.jpg',
      };
      expect(MemberEntity.getProfileCompleteness(member)).toBe(80);
    });
  });

  describe('getMissingFields', () => {
    it('全フィールド入力で空配列を返す', () => {
      const member = {
        name: '太郎',
        memberType: 'human' as const,
        birthDate: new Date('1990-01-01'),
        photoUrl: 'https://example.com/photo.jpg',
        notes: 'メモ',
      };
      expect(MemberEntity.getMissingFields(member)).toEqual([]);
    });

    it('未入力フィールドを返す', () => {
      const member = {
        name: '太郎',
        memberType: 'human' as const,
      };
      const missing = MemberEntity.getMissingFields(member);
      expect(missing).toContain('生年月日');
      expect(missing).toContain('写真');
      expect(missing).toContain('メモ');
    });
  });

  describe('getProfileCompletenessLabel', () => {
    it('100%は「完了」', () => {
      expect(MemberEntity.getProfileCompletenessLabel(100)).toBe('完了');
    });

    it('80%は「ほぼ完了」', () => {
      expect(MemberEntity.getProfileCompletenessLabel(80)).toBe('ほぼ完了');
    });

    it('50%は「半分入力済み」', () => {
      expect(MemberEntity.getProfileCompletenessLabel(50)).toBe('半分入力済み');
    });

    it('30%は「入力が必要」', () => {
      expect(MemberEntity.getProfileCompletenessLabel(30)).toBe('入力が必要');
    });
  });
});
