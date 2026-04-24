import { MedicationInfoRepository } from '../../domain/repositories/MedicationInfoRepository';
import {
  MedicationInfo,
  MedicationInfoSearchResult,
} from '../../domain/entities/MedicationInfo';
import { medicationInfoApi } from '../api/medicationInfoApi';

export class MedicationInfoRepositoryImpl implements MedicationInfoRepository {
  searchByName(query: string): Promise<MedicationInfoSearchResult[]> {
    return medicationInfoApi.search(query);
  }

  getById(id: string): Promise<MedicationInfo | null> {
    return medicationInfoApi.getById(id);
  }
}
