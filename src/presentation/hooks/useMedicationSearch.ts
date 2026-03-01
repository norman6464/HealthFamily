/**
 * お薬検索フック
 */

import { useState, useCallback, useMemo } from 'react';
import { MedicationSearchResult } from '../../domain/entities/MedicationSearchResult';
import { SearchMedications } from '../../domain/usecases/ManageMedications';
import { getDIContainer } from '../../infrastructure/DIContainer';

export interface UseMedicationSearchResult {
  results: MedicationSearchResult[];
  isSearching: boolean;
  hasSearched: boolean;
  search: (query: string) => Promise<void>;
}

export const useMedicationSearch = (): UseMedicationSearchResult => {
  const useCase = useMemo(() => {
    const { medicationRepository } = getDIContainer();
    return new SearchMedications(medicationRepository);
  }, []);

  const [results, setResults] = useState<MedicationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const data = await useCase.execute(query);
      setResults(data);
      setHasSearched(true);
    } catch {
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, [useCase]);

  return { results, isSearching, hasSearched, search };
};
