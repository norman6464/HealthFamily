/**
 * お薬検索結果エンティティ
 */

export interface MedicationSearchResult {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly memberId: string;
  readonly memberName: string;
  readonly dosageAmount?: string;
  readonly frequency?: string;
  readonly stockQuantity?: number;
}
