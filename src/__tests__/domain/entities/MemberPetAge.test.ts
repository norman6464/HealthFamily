import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity ペット年齢変換', () => {
  describe('getHumanEquivalentAge', () => {
    it('犬1歳は人間約15歳', () => {
      expect(MemberEntity.getHumanEquivalentAge(1, 'dog')).toBe(15);
    });

    it('犬2歳は人間約24歳', () => {
      expect(MemberEntity.getHumanEquivalentAge(2, 'dog')).toBe(24);
    });

    it('犬5歳は人間約36歳', () => {
      expect(MemberEntity.getHumanEquivalentAge(5, 'dog')).toBe(36);
    });

    it('猫1歳は人間約15歳', () => {
      expect(MemberEntity.getHumanEquivalentAge(1, 'cat')).toBe(15);
    });

    it('猫2歳は人間約24歳', () => {
      expect(MemberEntity.getHumanEquivalentAge(2, 'cat')).toBe(24);
    });

    it('猫5歳は人間約40歳', () => {
      expect(MemberEntity.getHumanEquivalentAge(5, 'cat')).toBeGreaterThanOrEqual(36);
    });

    it('その他のペットはnullを返す', () => {
      expect(MemberEntity.getHumanEquivalentAge(3, 'rabbit')).toBeNull();
    });

    it('nullの年齢はnullを返す', () => {
      expect(MemberEntity.getHumanEquivalentAge(null, 'dog')).toBeNull();
    });
  });

  describe('getPetAgeLabel', () => {
    it('犬の年齢ラベルを返す', () => {
      const label = MemberEntity.getPetAgeLabel(3, 'dog');
      expect(label).toContain('3歳');
      expect(label).toContain('人間');
    });

    it('変換不可のペットは年齢のみ返す', () => {
      const label = MemberEntity.getPetAgeLabel(2, 'rabbit');
      expect(label).toBe('2歳');
    });

    it('nullの年齢は年齢不明を返す', () => {
      expect(MemberEntity.getPetAgeLabel(null, 'dog')).toBe('年齢不明');
    });
  });

  describe('getPetLifeStage', () => {
    it('犬0歳は子犬を返す', () => {
      expect(MemberEntity.getPetLifeStage(0, 'dog')).toBe('子犬');
    });

    it('犬2歳は成犬を返す', () => {
      expect(MemberEntity.getPetLifeStage(2, 'dog')).toBe('成犬');
    });

    it('犬8歳はシニアを返す', () => {
      expect(MemberEntity.getPetLifeStage(8, 'dog')).toBe('シニア犬');
    });

    it('猫0歳は子猫を返す', () => {
      expect(MemberEntity.getPetLifeStage(0, 'cat')).toBe('子猫');
    });

    it('猫8歳はシニアを返す', () => {
      expect(MemberEntity.getPetLifeStage(8, 'cat')).toBe('シニア猫');
    });

    it('その他のペットはペットを返す', () => {
      expect(MemberEntity.getPetLifeStage(3, 'rabbit')).toContain('ペット');
    });

    it('nullの年齢は不明を返す', () => {
      expect(MemberEntity.getPetLifeStage(null, 'dog')).toBe('不明');
    });
  });
});
