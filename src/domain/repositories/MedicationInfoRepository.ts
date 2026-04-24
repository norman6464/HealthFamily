import { MedicationInfo, MedicationInfoSearchResult } from '../entities/MedicationInfo';

export interface MedicationInfoRepository {
  searchByName(query: string): Promise<MedicationInfoSearchResult[]>;
  getById(id: string): Promise<MedicationInfo | null>;
}
