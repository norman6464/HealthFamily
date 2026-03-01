/**
 * 在庫アラート取得フック
 */

import { useMemo } from 'react';
import { StockAlert } from '../../domain/entities/StockAlert';
import { GetStockAlerts } from '../../domain/usecases/ManageMedications';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseStockAlertsResult {
  alerts: StockAlert[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useStockAlerts = (): UseStockAlertsResult => {
  const useCase = useMemo(() => {
    const { medicationRepository } = getDIContainer();
    return new GetStockAlerts(medicationRepository);
  }, []);

  const { data, isLoading, error, refetch } = useFetcher(
    () => useCase.execute(),
    [useCase],
    [] as StockAlert[],
  );

  return { alerts: data, isLoading, error, refetch };
};
