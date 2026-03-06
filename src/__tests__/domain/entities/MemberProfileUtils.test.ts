import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity プロフィールユーティリティ', () => {
  describe('calculateAge', () => {
    it('正確な年齢を返す', () => {
      expect(MemberEntity.calculateAge(new Date('2020-01-01'), new Date('2026-03-05'))).toBe(6);
    });

    it('誕生日前は年齢-1を返す', () => {
      expect(MemberEntity.calculateAge(new Date('2020-06-01'), new Date('2026-03-05'))).toBe(5);
    });

    it('誕生日当日は年齢を返す', () => {
      expect(MemberEntity.calculateAge(new Date('2020-03-05'), new Date('2026-03-05'))).toBe(6);
    });

    it('nullの場合はnullを返す', () => {
      expect(MemberEntity.calculateAge(null, new Date('2026-03-05'))).toBeNull();
    });

    it('undefinedの場合はnullを返す', () => {
      expect(MemberEntity.calculateAge(undefined, new Date('2026-03-05'))).toBeNull();
    });
  });

  describe('getMemberTypeLabel', () => {
    it('humanは家族を返す', () => {
      expect(MemberEntity.getMemberTypeLabel('human')).toBe('家族');
    });

    it('petはペットを返す', () => {
      expect(MemberEntity.getMemberTypeLabel('pet')).toBe('ペット');
    });
  });

  describe('getPetTypeLabel', () => {
    it('dogは犬を返す', () => {
      expect(MemberEntity.getPetTypeLabel('dog')).toBe('犬');
    });

    it('catは猫を返す', () => {
      expect(MemberEntity.getPetTypeLabel('cat')).toBe('猫');
    });

    it('rabbitはうさぎを返す', () => {
      expect(MemberEntity.getPetTypeLabel('rabbit')).toBe('うさぎ');
    });

    it('birdは鳥を返す', () => {
      expect(MemberEntity.getPetTypeLabel('bird')).toBe('鳥');
    });

    it('otherはその他を返す', () => {
      expect(MemberEntity.getPetTypeLabel('other')).toBe('その他');
    });

    it('undefinedは空文字を返す', () => {
      expect(MemberEntity.getPetTypeLabel(undefined)).toBe('');
    });
  });

  describe('getProfileSummary', () => {
    it('人間メンバーの要約', () => {
      expect(MemberEntity.getProfileSummary('human', 30)).toBe('家族 (30歳)');
    });

    it('年齢なしの人間メンバー', () => {
      expect(MemberEntity.getProfileSummary('human', null)).toBe('家族');
    });

    it('ペットメンバーの要約', () => {
      expect(MemberEntity.getProfileSummary('pet', 3, 'dog')).toBe('ペット - 犬 (3歳)');
    });

    it('年齢なしのペットメンバー', () => {
      expect(MemberEntity.getProfileSummary('pet', null, 'cat')).toBe('ペット - 猫');
    });

    it('ペットタイプなしのペット', () => {
      expect(MemberEntity.getProfileSummary('pet', 2)).toBe('ペット (2歳)');
    });
  });
});
