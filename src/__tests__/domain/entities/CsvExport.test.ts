import { describe, it, expect } from 'vitest';
import { CsvExportEntity } from '../../../domain/entities/CsvExport';
import { MedicationRecord } from '../../../domain/entities/MedicationRecord';

describe('CsvExportEntity', () => {
  const sampleRecords: MedicationRecord[] = [
    {
      id: '1',
      memberId: 'm1',
      memberName: 'ゆう',
      medicationId: 'med1',
      medicationName: 'クラリチン',
      userId: 'u1',
      takenAt: new Date('2026-03-28T03:00:00.000Z'), // JST 12:00
      notes: '食後に服用',
    },
    {
      id: '2',
      memberId: 'm2',
      memberName: 'やじゅ',
      medicationId: 'med2',
      medicationName: 'ピモベハート',
      userId: 'u1',
      takenAt: new Date('2026-03-28T00:00:00.000Z'), // JST 09:00
      notes: undefined,
    },
  ];

  describe('toCsvString', () => {
    it('BOM付きUTF-8のCSV文字列を生成する', () => {
      const csv = CsvExportEntity.toCsvString(sampleRecords);
      expect(csv.charCodeAt(0)).toBe(0xFEFF); // BOM
    });

    it('ヘッダー行が正確に出力される', () => {
      const csv = CsvExportEntity.toCsvString(sampleRecords);
      const lines = csv.split('\n');
      const header = lines[0].replace(/^\uFEFF/, '');
      expect(header).toBe('日付,メンバー名,お薬名,服薬時刻,メモ');
    });

    it('レコードが正しくCSV行に変換される', () => {
      const csv = CsvExportEntity.toCsvString(sampleRecords);
      const lines = csv.split('\n');
      // ヘッダー + 2レコード
      expect(lines.length).toBeGreaterThanOrEqual(3);
      expect(lines[1]).toContain('ゆう');
      expect(lines[1]).toContain('クラリチン');
    });

    it('メモが空のレコードでも出力される', () => {
      const csv = CsvExportEntity.toCsvString(sampleRecords);
      const lines = csv.split('\n');
      expect(lines[2]).toContain('やじゅ');
      expect(lines[2]).toContain('ピモベハート');
    });

    it('空のレコード配列ではヘッダーのみ出力される', () => {
      const csv = CsvExportEntity.toCsvString([]);
      const lines = csv.split('\n').filter((l) => l.trim());
      expect(lines.length).toBe(1); // ヘッダーのみ（BOM付き）
    });

    it('カンマを含むメモはダブルクォートでエスケープされる', () => {
      const records: MedicationRecord[] = [
        {
          ...sampleRecords[0],
          notes: '朝食後,昼食前',
        },
      ];
      const csv = CsvExportEntity.toCsvString(records);
      expect(csv).toContain('"朝食後,昼食前"');
    });

    it('ダブルクォートを含むメモは適切にエスケープされる', () => {
      const records: MedicationRecord[] = [
        {
          ...sampleRecords[0],
          notes: '"重要"なメモ',
        },
      ];
      const csv = CsvExportEntity.toCsvString(records);
      expect(csv).toContain('"""重要""なメモ"');
    });
    it('数式として解釈される先頭文字が無害化される', () => {
      const formulaTests = ['=1+1', '+cmd', '-danger', '@SUM(A1)'];
      for (const notes of formulaTests) {
        const records: MedicationRecord[] = [
          { ...sampleRecords[0], notes },
        ];
        const csv = CsvExportEntity.toCsvString(records);
        // 先頭にシングルクォートが付加されること
        expect(csv).toContain(`'${notes}`);
        // 元の値がそのまま出力されないこと
        expect(csv).not.toContain(`,${notes}`);
      }
    });
  });

  describe('getFilename', () => {
    it('日付付きのファイル名を生成する', () => {
      const filename = CsvExportEntity.getFilename();
      expect(filename).toMatch(/^服薬履歴_\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });
});
