import { describe, it, expect } from 'vitest';
import { Member, MemberEntity } from '../Member';

describe('MemberEntity', () => {
  const mockHumanMember: Member = {
    id: 'member-1',
    userId: 'user-1',
    memberType: 'human',
    name: 'パパ',
    birthDate: new Date('1985-06-15'),
    notes: '高血圧',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPetMember: Member = {
    id: 'member-2',
    userId: 'user-1',
    memberType: 'pet',
    name: 'ポチ',
    petType: 'dog',
    birthDate: new Date('2020-03-10'),
    notes: 'フィラリア注意',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('isPet / isHuman', () => {
    it('人間メンバーの場合、isHumanがtrue、isPetがfalseを返す', () => {
      const entity = new MemberEntity(mockHumanMember);
      expect(entity.isHuman()).toBe(true);
      expect(entity.isPet()).toBe(false);
    });

    it('ペットメンバーの場合、isPetがtrue、isHumanがfalseを返す', () => {
      const entity = new MemberEntity(mockPetMember);
      expect(entity.isPet()).toBe(true);
      expect(entity.isHuman()).toBe(false);
    });
  });

  describe('getAge', () => {
    it('生年月日から年齢を正しく計算する', () => {
      const entity = new MemberEntity({
        ...mockHumanMember,
        birthDate: new Date('2000-01-01'),
      });
      const age = entity.getAge();
      expect(age).toBeGreaterThanOrEqual(24);
    });

    it('生年月日がない場合、nullを返す', () => {
      const entity = new MemberEntity({
        ...mockHumanMember,
        birthDate: undefined,
      });
      expect(entity.getAge()).toBeNull();
    });

    it('誕生日前の場合、1歳少なく計算される', () => {
      const today = new Date();
      const futureMonth = today.getMonth() + 2;
      const birthDate = new Date(today.getFullYear() - 30, futureMonth, 15);
      const entity = new MemberEntity({
        ...mockHumanMember,
        birthDate,
      });
      expect(entity.getAge()).toBe(29);
    });
  });

  describe('getIconType', () => {
    it('人間メンバーの場合、memberType: humanを返す', () => {
      const entity = new MemberEntity(mockHumanMember);
      expect(entity.getIconType()).toEqual({ memberType: 'human', petType: undefined });
    });

    it('犬の場合、memberType: pet, petType: dogを返す', () => {
      const entity = new MemberEntity(mockPetMember);
      expect(entity.getIconType()).toEqual({ memberType: 'pet', petType: 'dog' });
    });

    it('猫の場合、petType: catを返す', () => {
      const entity = new MemberEntity({
        ...mockPetMember,
        petType: 'cat',
      });
      expect(entity.getIconType().petType).toBe('cat');
    });

    it('ペットタイプ未設定の場合、petType: undefinedを返す', () => {
      const entity = new MemberEntity({
        ...mockPetMember,
        petType: undefined,
      });
      expect(entity.getIconType().petType).toBeUndefined();
    });
  });

  describe('getters', () => {
    it('idを取得できる', () => {
      const entity = new MemberEntity(mockHumanMember);
      expect(entity.id).toBe('member-1');
    });

    it('nameを取得できる', () => {
      const entity = new MemberEntity(mockHumanMember);
      expect(entity.name).toBe('パパ');
    });

    it('dataを取得できる', () => {
      const entity = new MemberEntity(mockHumanMember);
      expect(entity.data).toEqual(mockHumanMember);
    });
  });

  describe('getDisplayInfo', () => {
    it('人間メンバーの表示情報を取得できる', () => {
      const entity = new MemberEntity(mockHumanMember);
      const info = entity.getDisplayInfo();
      expect(info.memberType).toBe('human');
      expect(info.name).toBe('パパ');
      expect(info.typeLabel).toBe('家族');
    });

    it('ペットメンバーの表示情報を取得できる', () => {
      const entity = new MemberEntity(mockPetMember);
      const info = entity.getDisplayInfo();
      expect(info.memberType).toBe('pet');
      expect(info.petType).toBe('dog');
      expect(info.name).toBe('ポチ');
      expect(info.typeLabel).toBe('ペット');
    });
  });
});
