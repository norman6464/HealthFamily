import { MedicationRecord } from './MedicationRecord';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateJST(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeJST(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const h = String(jst.getUTCHours()).padStart(2, '0');
  const min = String(jst.getUTCMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

const CSV_HEADERS = ['日付', 'メンバー', 'お薬名', '服薬時刻', 'メモ'];
const BOM = '\uFEFF';

export class CsvExportEntity {
  static toCsvString(records: MedicationRecord[]): string {
    const header = CSV_HEADERS.join(',');
    const rows = records.map((r) => {
      const fields = [
        formatDateJST(r.takenAt),
        escapeCsvField(r.memberName),
        escapeCsvField(r.medicationName),
        formatTimeJST(r.takenAt),
        escapeCsvField(r.notes || ''),
      ];
      return fields.join(',');
    });
    return BOM + [header, ...rows].join('\n');
  }

  static getFilename(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `服薬履歴_${y}-${m}-${d}.csv`;
  }
}
