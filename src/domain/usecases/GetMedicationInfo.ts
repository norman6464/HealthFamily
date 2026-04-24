import { MedicationInfo, MedicationInfoSearchResult } from '../entities/MedicationInfo';
import { MedicationInfoRepository } from '../repositories/MedicationInfoRepository';

export class SearchMedicationInfo {
  constructor(private readonly repository: MedicationInfoRepository) {}

  async execute(query: string): Promise<MedicationInfoSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return this.repository.searchByName(trimmed);
  }
}

export class GetMedicationInfo {
  constructor(private readonly repository: MedicationInfoRepository) {}

  async execute(id: string): Promise<MedicationInfo | null> {
    const trimmed = id.trim();
    if (!trimmed) return null;
    return this.repository.getById(trimmed);
  }
}
