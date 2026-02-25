import { describe, it, expect } from 'vitest';
import { pickAllowedFields, isNonEmptyString, isValidLength } from '../validation';

describe('validation', () => {
  describe('pickAllowedFields', () => {
    it('許可されたフィールドのみを抽出する', () => {
      const body = { name: 'テスト', age: 30, role: 'admin' };
      const result = pickAllowedFields(body, ['name', 'age']);

      expect(result).toEqual({ name: 'テスト', age: 30 });
    });

    it('存在しないフィールドは無視される', () => {
      const body = { name: 'テスト' };
      const result = pickAllowedFields(body, ['name', 'age']);

      expect(result).toEqual({ name: 'テスト' });
    });

    it('undefinedのフィールドは除外される', () => {
      const body = { name: 'テスト', age: undefined };
      const result = pickAllowedFields(body, ['name', 'age']);

      expect(result).toEqual({ name: 'テスト' });
    });

    it('空のbodyの場合、空オブジェクトを返す', () => {
      const body = {};
      const result = pickAllowedFields(body, ['name', 'age']);

      expect(result).toEqual({});
    });

    it('システムフィールド（userId, createdAt等）をブロックする', () => {
      const body = {
        name: 'テスト',
        userId: 'attacker-id',
        createdAt: '2020-01-01',
        memberId: 'fake-id',
      };
      const result = pickAllowedFields(body, ['name']);

      expect(result).toEqual({ name: 'テスト' });
      expect(result).not.toHaveProperty('userId');
      expect(result).not.toHaveProperty('createdAt');
    });

    it('プロトタイプ汚染を防止する', () => {
      const body = { __proto__: { polluted: true }, name: 'テスト' };
      const result = pickAllowedFields(body, ['name', '__proto__']);

      expect(result).toEqual({ name: 'テスト' });
    });
  });

  describe('isNonEmptyString', () => {
    it('通常の文字列はtrueを返す', () => {
      expect(isNonEmptyString('テスト')).toBe(true);
    });

    it('空文字はfalseを返す', () => {
      expect(isNonEmptyString('')).toBe(false);
    });

    it('空白のみはfalseを返す', () => {
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('nullはfalseを返す', () => {
      expect(isNonEmptyString(null)).toBe(false);
    });

    it('undefinedはfalseを返す', () => {
      expect(isNonEmptyString(undefined)).toBe(false);
    });

    it('数値はfalseを返す', () => {
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('isValidLength', () => {
    it('制限内の文字列はtrueを返す', () => {
      expect(isValidLength('abc', 5)).toBe(true);
    });

    it('制限と同じ長さはtrueを返す', () => {
      expect(isValidLength('abcde', 5)).toBe(true);
    });

    it('制限を超える文字列はfalseを返す', () => {
      expect(isValidLength('abcdef', 5)).toBe(false);
    });
  });
});
