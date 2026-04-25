/**
 * 外部医薬品データベースから取得する薬剤情報エンティティ
 */

export interface MedicationInfoSearchResult {
  id: string;
  name: string;
}

export interface MedicationInfo {
  id: string;
  name: string;
  efficacy?: string;
  components?: string;
  remark?: string;
  sourceUrl: string;
  source: 'kegg';
}
