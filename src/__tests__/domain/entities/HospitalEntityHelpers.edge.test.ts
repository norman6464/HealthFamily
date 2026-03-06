import { describe, it, expect } from 'vitest';
import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity 表示ヘルパー エッジケース', () => {
  describe('getHospitalTypeLabel', () => {
    it('空文字はそのまま返す', () => {
      expect(HospitalEntity.getHospitalTypeLabel('')).toBe('');
    });
  });

  describe('getDisplayInfo', () => {
    it('全項目が未設定の場合は空文字を返す', () => {
      const info = HospitalEntity.getDisplayInfo({ name: '' });
      expect(info.name).toBe('');
      expect(info.typeLabel).toBe('');
      expect(info.address).toBe('');
      expect(info.phoneNumber).toBe('');
    });

    it('空文字のhospitalTypeはラベル変換される', () => {
      const info = HospitalEntity.getDisplayInfo({ name: 'テスト', hospitalType: '' });
      expect(info.typeLabel).toBe('');
    });
  });

  describe('formatPhoneNumber', () => {
    it('undefinedはハイフンを返す', () => {
      expect(HospitalEntity.formatPhoneNumber(undefined)).toBe('-');
    });

    it('空白のみはハイフンを返す', () => {
      expect(HospitalEntity.formatPhoneNumber('   ')).toBe('-');
    });

    it('9桁の番号はそのまま返す', () => {
      expect(HospitalEntity.formatPhoneNumber('123456789')).toBe('123456789');
    });

    it('12桁の番号はそのまま返す', () => {
      expect(HospitalEntity.formatPhoneNumber('123456789012')).toBe('123456789012');
    });

    it('既にハイフン付き11桁はそのまま返す', () => {
      expect(HospitalEntity.formatPhoneNumber('090-1234-5678')).toBe('090-1234-5678');
    });
  });
});
