import { describe, it, expect } from 'vitest';
import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity 表示ヘルパー', () => {
  describe('getHospitalTypeLabel', () => {
    it('generalは総合病院を返す', () => {
      expect(HospitalEntity.getHospitalTypeLabel('general')).toBe('総合病院');
    });

    it('clinicはクリニックを返す', () => {
      expect(HospitalEntity.getHospitalTypeLabel('clinic')).toBe('クリニック');
    });

    it('dentalは歯科を返す', () => {
      expect(HospitalEntity.getHospitalTypeLabel('dental')).toBe('歯科');
    });

    it('pharmacyは薬局を返す', () => {
      expect(HospitalEntity.getHospitalTypeLabel('pharmacy')).toBe('薬局');
    });

    it('veterinaryは動物病院を返す', () => {
      expect(HospitalEntity.getHospitalTypeLabel('veterinary')).toBe('動物病院');
    });

    it('未知の種別はそのまま返す', () => {
      expect(HospitalEntity.getHospitalTypeLabel('unknown_type')).toBe('unknown_type');
    });
  });

  describe('getDisplayInfo', () => {
    it('全項目ありの場合まとめて返す', () => {
      const info = HospitalEntity.getDisplayInfo({
        name: 'テスト病院',
        hospitalType: 'general',
        address: '東京都渋谷区',
        phoneNumber: '03-1234-5678',
      });
      expect(info.name).toBe('テスト病院');
      expect(info.typeLabel).toBe('総合病院');
      expect(info.address).toBe('東京都渋谷区');
      expect(info.phoneNumber).toBe('03-1234-5678');
    });

    it('種別なしの場合typeLabelは空文字を返す', () => {
      const info = HospitalEntity.getDisplayInfo({
        name: 'テスト病院',
      });
      expect(info.typeLabel).toBe('');
    });

    it('住所なしの場合addressは空文字を返す', () => {
      const info = HospitalEntity.getDisplayInfo({
        name: 'テスト病院',
      });
      expect(info.address).toBe('');
    });

    it('電話番号なしの場合phoneNumberは空文字を返す', () => {
      const info = HospitalEntity.getDisplayInfo({
        name: 'テスト病院',
      });
      expect(info.phoneNumber).toBe('');
    });
  });

  describe('formatPhoneNumber', () => {
    it('ハイフン付きはそのまま返す', () => {
      expect(HospitalEntity.formatPhoneNumber('03-1234-5678')).toBe('03-1234-5678');
    });

    it('ハイフンなし10桁は市外局番形式にフォーマットする', () => {
      expect(HospitalEntity.formatPhoneNumber('0312345678')).toBe('03-1234-5678');
    });

    it('ハイフンなし11桁は携帯形式にフォーマットする', () => {
      expect(HospitalEntity.formatPhoneNumber('09012345678')).toBe('090-1234-5678');
    });

    it('nullはハイフンを返す', () => {
      expect(HospitalEntity.formatPhoneNumber(null)).toBe('-');
    });

    it('空文字はハイフンを返す', () => {
      expect(HospitalEntity.formatPhoneNumber('')).toBe('-');
    });

    it('その他のフォーマットはそのまま返す', () => {
      expect(HospitalEntity.formatPhoneNumber('12345')).toBe('12345');
    });
  });
});
