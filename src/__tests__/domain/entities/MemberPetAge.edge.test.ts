import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberPetAge エッジケース', () => {
  describe('getHumanEquivalentAge', () => {
    it('年齢0は0を返す', () => {
      expect(MemberEntity.getHumanEquivalentAge(0, 'dog')).toBe(0);
    });

    it('年齢20の犬は人間換算96歳', () => {
      // 24 + (20-2)*4 = 24 + 72 = 96
      expect(MemberEntity.getHumanEquivalentAge(20, 'dog')).toBe(96);
    });

    it('birdタイプはnullを返す', () => {
      expect(MemberEntity.getHumanEquivalentAge(5, 'bird')).toBeNull();
    });

    it('otherタイプはnullを返す', () => {
      expect(MemberEntity.getHumanEquivalentAge(3, 'other')).toBeNull();
    });
  });

  describe('getPetLifeStage', () => {
    it('犬6歳は成犬（境界値）', () => {
      expect(MemberEntity.getPetLifeStage(6, 'dog')).toBe('成犬');
    });

    it('犬7歳はシニア犬（境界値）', () => {
      expect(MemberEntity.getPetLifeStage(7, 'dog')).toBe('シニア犬');
    });

    it('猫1歳は成猫（境界値）', () => {
      expect(MemberEntity.getPetLifeStage(1, 'cat')).toBe('成猫');
    });

    it('birdの年齢指定はペットを返す', () => {
      expect(MemberEntity.getPetLifeStage(5, 'bird')).toBe('ペット');
    });
  });

  describe('getPetAgeLabel', () => {
    it('猫0歳は人間換算0歳', () => {
      const label = MemberEntity.getPetAgeLabel(0, 'cat');
      expect(label).toContain('0歳');
      expect(label).toContain('人間換算');
    });
  });
});
