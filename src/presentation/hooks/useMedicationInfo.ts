import { useState, useCallback, useMemo } from 'react';
import {
  MedicationInfo,
  MedicationInfoSearchResult,
} from '../../domain/entities/MedicationInfo';
import {
  SearchMedicationInfo,
  GetMedicationInfo,
} from '../../domain/usecases/GetMedicationInfo';
import { getDIContainer } from '../../infrastructure/DIContainer';

export interface UseMedicationInfoResult {
  searchResults: MedicationInfoSearchResult[];
  selectedInfo: MedicationInfo | null;
  isLoading: boolean;
  hasSearched: boolean;
  error: Error | null;
  search: (query: string) => Promise<void>;
  selectById: (id: string) => Promise<void>;
  clearSelection: () => void;
  reset: () => void;
}

export const useMedicationInfo = (): UseMedicationInfoResult => {
  const useCases = useMemo(() => {
    const { medicationInfoRepository } = getDIContainer();
    return {
      search: new SearchMedicationInfo(medicationInfoRepository),
      get: new GetMedicationInfo(medicationInfoRepository),
    };
  }, []);

  const [searchResults, setSearchResults] = useState<MedicationInfoSearchResult[]>([]);
  const [selectedInfo, setSelectedInfo] = useState<MedicationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedInfo(null);
    try {
      const data = await useCases.search.execute(query);
      setSearchResults(data);
      setHasSearched(true);
    } catch (err) {
      setSearchResults([]);
      setHasSearched(true);
      setError(err instanceof Error ? err : new Error('検索に失敗しました'));
    } finally {
      setIsLoading(false);
    }
  }, [useCases]);

  const selectById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await useCases.get.execute(id);
      if (!data) {
        setError(new Error('薬剤情報が見つかりませんでした'));
        return;
      }
      setSelectedInfo(data);
    } catch (err) {
      setSelectedInfo(null);
      setError(err instanceof Error ? err : new Error('薬剤情報の取得に失敗しました'));
    } finally {
      setIsLoading(false);
    }
  }, [useCases]);

  const clearSelection = useCallback(() => {
    setSelectedInfo(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setSearchResults([]);
    setSelectedInfo(null);
    setHasSearched(false);
    setError(null);
  }, []);

  return {
    searchResults,
    selectedInfo,
    isLoading,
    hasSearched,
    error,
    search,
    selectById,
    clearSelection,
    reset,
  };
};
