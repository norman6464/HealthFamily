import { apiClient, ApiError } from './apiClient';
import {
  MedicationInfo,
  MedicationInfoSearchResult,
} from '../../domain/entities/MedicationInfo';

export const medicationInfoApi = {
  async search(query: string): Promise<MedicationInfoSearchResult[]> {
    return apiClient.get<MedicationInfoSearchResult[]>(
      `/external/medication-info/search?q=${encodeURIComponent(query)}`,
    );
  },

  async getById(id: string): Promise<MedicationInfo | null> {
    try {
      return await apiClient.get<MedicationInfo>(
        `/external/medication-info/${encodeURIComponent(id)}`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },
};
