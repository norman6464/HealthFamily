import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemberEntity, Member } from '@/domain/entities/Member';

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  userId: 'user-1',
  memberType: 'human',
  name: '太郎',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('MemberEntity エッジケーステスト', () => {
  describe('getAge 境界値', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-05'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('birthDateがnullの場合はnullを返す', () => {
      const entity = new MemberEntity(createMember({ birthDate: undefined }));
      expect(entity.getAge()).toBeNull();
    });

    it('誕生日当日は正しい年齢を返す', () => {
      const entity = new MemberEntity(createMember({ birthDate: new Date('1996-03-05') }));
      expect(entity.getAge()).toBe(30);
    });

    it('誕生日前日はまだ前の年齢', () => {
      const entity = new MemberEntity(createMember({ birthDate: new Date('1996-03-06') }));
      expect(entity.getAge()).toBe(29);
    });

    it('生まれたばかり（同年）は0歳', () => {
      const entity = new MemberEntity(createMember({ birthDate: new Date('2026-01-01') }));
      expect(entity.getAge()).toBe(0);
    });

    it('うるう年2月29日生まれ（3月5日時点）', () => {
      const entity = new MemberEntity(createMember({ birthDate: new Date('2000-02-29') }));
      expect(entity.getAge()).toBe(26);
    });
  });

  describe('getMemberIcon 全パターン', () => {
    it('humanはUserを返す', () => {
      expect(MemberEntity.getMemberIcon('human')).toBe('User');
    });

    it('petType=dogはDogを返す', () => {
      expect(MemberEntity.getMemberIcon('pet', 'dog')).toBe('Dog');
    });

    it('petType=catはCatを返す', () => {
      expect(MemberEntity.getMemberIcon('pet', 'cat')).toBe('Cat');
    });

    it('petType=rabbitはRabbitを返す', () => {
      expect(MemberEntity.getMemberIcon('pet', 'rabbit')).toBe('Rabbit');
    });

    it('petType=birdはBirdを返す', () => {
      expect(MemberEntity.getMemberIcon('pet', 'bird')).toBe('Bird');
    });

    it('petType=otherはPawPrintを返す', () => {
      expect(MemberEntity.getMemberIcon('pet', 'other')).toBe('PawPrint');
    });

    it('petType未指定はPawPrintを返す', () => {
      expect(MemberEntity.getMemberIcon('pet')).toBe('PawPrint');
    });
  });

  describe('validateName 追加境界値', () => {
    it('ちょうど1文字はvalid', () => {
      expect(MemberEntity.validateName('あ').valid).toBe(true);
    });

    it('ちょうど20文字はvalid', () => {
      expect(MemberEntity.validateName('あ'.repeat(20)).valid).toBe(true);
    });

    it('ちょうど21文字はinvalid', () => {
      expect(MemberEntity.validateName('あ'.repeat(21)).valid).toBe(false);
    });

    it('タブ文字のみはinvalid', () => {
      expect(MemberEntity.validateName('\t\t').valid).toBe(false);
    });
  });

  describe('getDisplayInfo', () => {
    it('humanの場合のtypeLabelは家族', () => {
      const entity = new MemberEntity(createMember({ memberType: 'human' }));
      expect(entity.getDisplayInfo().typeLabel).toBe('家族');
    });

    it('petの場合のtypeLabelはペット', () => {
      const entity = new MemberEntity(createMember({ memberType: 'pet', petType: 'dog' }));
      expect(entity.getDisplayInfo().typeLabel).toBe('ペット');
    });
  });

  describe('sanitizeName 追加テスト', () => {
    it('タブ文字も空白として正規化する', () => {
      expect(MemberEntity.sanitizeName('山田\t太郎')).toBe('山田 太郎');
    });

    it('改行文字も空白として正規化する', () => {
      expect(MemberEntity.sanitizeName('山田\n太郎')).toBe('山田 太郎');
    });
  });
});
