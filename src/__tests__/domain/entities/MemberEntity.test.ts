import { describe, it, expect } from 'vitest';
import { MemberEntity, Member } from '@/domain/entities/Member';

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  userId: 'user-1',
  memberType: 'human',
  name: 'テスト太郎',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('MemberEntity', () => {
  describe('isPet / isHuman', () => {
    it('人間メンバーの場合 isHuman が true を返す', () => {
      const entity = new MemberEntity(createMember({ memberType: 'human' }));
      expect(entity.isHuman()).toBe(true);
      expect(entity.isPet()).toBe(false);
    });

    it('ペットメンバーの場合 isPet が true を返す', () => {
      const entity = new MemberEntity(createMember({ memberType: 'pet', petType: 'dog' }));
      expect(entity.isPet()).toBe(true);
      expect(entity.isHuman()).toBe(false);
    });
  });

  describe('getAge', () => {
    it('生年月日がない場合 null を返す', () => {
      const entity = new MemberEntity(createMember());
      expect(entity.getAge()).toBeNull();
    });

    it('生年月日がある場合、年齢を計算する', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 5);
      birthDate.setMonth(birthDate.getMonth() - 1);
      const entity = new MemberEntity(createMember({ birthDate }));
      expect(entity.getAge()).toBe(5);
    });
  });

  describe('getDisplayInfo', () => {
    it('人間メンバーの表示情報を返す', () => {
      const entity = new MemberEntity(createMember({ memberType: 'human', name: '太郎' }));
      const info = entity.getDisplayInfo();
      expect(info.name).toBe('太郎');
      expect(info.typeLabel).toBe('家族');
    });

    it('ペットメンバーの表示情報を返す', () => {
      const entity = new MemberEntity(createMember({ memberType: 'pet', name: 'ポチ', petType: 'dog' }));
      const info = entity.getDisplayInfo();
      expect(info.name).toBe('ポチ');
      expect(info.typeLabel).toBe('ペット');
      expect(info.petType).toBe('dog');
    });
  });

  describe('id / name / data', () => {
    it('プロパティにアクセスできる', () => {
      const member = createMember({ id: 'abc', name: '花子' });
      const entity = new MemberEntity(member);
      expect(entity.id).toBe('abc');
      expect(entity.name).toBe('花子');
      expect(entity.data).toBe(member);
    });
  });
});
