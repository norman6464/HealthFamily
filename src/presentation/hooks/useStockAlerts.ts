/**
 * 在庫アラート取得フック
 */

import { StockAlert, medicationApi } from '../../data/api/medicationApi';
import { useFetcher } from './useFetcher';

export interface UseStockAlertsResult {
  alerts: StockAlert[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useStockAlerts = (): UseStockAlertsResult => {
  const { data, isLoading, error, refetch } = useFetcher(
    () => medicationApi.getStockAlerts(),
    [],
    [] as StockAlert[],
  );

  return { alerts: data, isLoading, error, refetch };
};
