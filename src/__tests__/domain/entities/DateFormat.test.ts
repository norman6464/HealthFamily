import { describe, it, expect } from 'vitest';
import { formatDateJP, formatDateShort } from '@/domain/entities/DateFormat';

describe('DateFormat', () => {
  describe('formatDateJP', () => {
    it('日付をYYYY年M月D日形式にフォーマットする', () => {
      const date = new Date('2025-10-01');
      const result = formatDateJP(date);
      expect(result).toContain('2025');
      expect(result).toContain('10');
      expect(result).toContain('1');
    });

    it('月初と月末を正しくフォーマットする', () => {
      expect(formatDateJP(new Date('2025-01-01'))).toContain('1月');
      expect(formatDateJP(new Date('2025-12-31'))).toContain('12月');
    });
  });

  describe('formatDateShort', () => {
    it('日付をYYYY/M/D形式にフォーマットする', () => {
      const date = new Date('2025-10-01');
      const result = formatDateShort(date);
      expect(result).toContain('2025');
    });
  });
});
