import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Profile Completeness Edge Cases', () => {
  describe('getProfileCompleteness 境界値', () => {
    it('全フィールドnullの場合は最低限(名前+タイプで40%)', () => {
      const member = {
        name: '太郎',
        memberType: 'human' as const,
        birthDate: null,
        photoUrl: null,
        notes: null,
      };
      expect(MemberEntity.getProfileCompleteness(member)).toBe(40);
    });

    it('空文字のnotesは未入力扱い', () => {
      const member = {
        name: '太郎',
        memberType: 'human' as const,
        notes: '',
      };
      expect(MemberEntity.getProfileCompleteness(member)).toBe(40);
    });
  });

  describe('getMissingFields 境界値', () => {
    it('全てnullの場合3フィールド', () => {
      const member = {
        name: '太郎',
        memberType: 'human' as const,
        birthDate: null,
        photoUrl: null,
        notes: null,
      };
      expect(MemberEntity.getMissingFields(member)).toHaveLength(3);
    });
  });

  describe('getProfileCompletenessLabel 境界値', () => {
    it('0%は「入力が必要」', () => {
      expect(MemberEntity.getProfileCompletenessLabel(0)).toBe('入力が必要');
    });

    it('49%は「入力が必要」', () => {
      expect(MemberEntity.getProfileCompletenessLabel(49)).toBe('入力が必要');
    });

    it('50%は「半分入力済み」', () => {
      expect(MemberEntity.getProfileCompletenessLabel(50)).toBe('半分入力済み');
    });

    it('79%は「半分入力済み」', () => {
      expect(MemberEntity.getProfileCompletenessLabel(79)).toBe('半分入力済み');
    });
  });
});
