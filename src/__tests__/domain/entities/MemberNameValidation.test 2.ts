import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity メンバー名バリデーション', () => {
  describe('validateName', () => {
    it('正常な名前はvalid=trueを返す', () => {
      const result = MemberEntity.validateName('太郎');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('空文字はvalid=falseを返す', () => {
      const result = MemberEntity.validateName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('名前を入力してください');
    });

    it('空白のみはvalid=falseを返す', () => {
      const result = MemberEntity.validateName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('名前を入力してください');
    });

    it('20文字以内はvalid=trueを返す', () => {
      const result = MemberEntity.validateName('あ'.repeat(20));
      expect(result.valid).toBe(true);
    });

    it('21文字以上はvalid=falseを返す', () => {
      const result = MemberEntity.validateName('あ'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('名前は20文字以内で入力してください');
    });

    it('前後の空白はトリム後に判定する', () => {
      const result = MemberEntity.validateName('  太郎  ');
      expect(result.valid).toBe(true);
    });
  });

  describe('sanitizeName', () => {
    it('前後の空白をトリムする', () => {
      expect(MemberEntity.sanitizeName('  太郎  ')).toBe('太郎');
    });

    it('連続空白を1つに正規化する', () => {
      expect(MemberEntity.sanitizeName('山田  太郎')).toBe('山田 太郎');
    });

    it('前後トリムと連続空白正規化を同時に行う', () => {
      expect(MemberEntity.sanitizeName('  山田   太郎  ')).toBe('山田 太郎');
    });

    it('空文字はそのまま返す', () => {
      expect(MemberEntity.sanitizeName('')).toBe('');
    });
  });

  describe('getNameInitial', () => {
    it('日本語名の最初の1文字を返す', () => {
      expect(MemberEntity.getNameInitial('太郎')).toBe('太');
    });

    it('英語名の最初の1文字を大文字で返す', () => {
      expect(MemberEntity.getNameInitial('john')).toBe('J');
    });

    it('空文字は?を返す', () => {
      expect(MemberEntity.getNameInitial('')).toBe('?');
    });

    it('空白のみは?を返す', () => {
      expect(MemberEntity.getNameInitial('   ')).toBe('?');
    });
  });
});
