/**
 * 体調記録カスタムフック（ViewModel）
 */

import { useCallback, useMemo } from 'react';
import { DailyHealthLogGroup } from '../../domain/entities/HealthLog';
import { GetHealthLogs, CreateHealthLog, DeleteHealthLog } from '../../domain/usecases/ManageHealthLogs';
import { CreateHealthLogInput } from '../../domain/repositories/HealthLogRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseHealthLogsResult {
  groups: DailyHealthLogGroup[];
  isLoading: boolean;
  error: Error | null;
  createLog: (input: CreateHealthLogInput) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useHealthLogs = (): UseHealthLogsResult => {
  const useCases = useMemo(() => {
    const { healthLogRepository } = getDIContainer();
    return {
      getLogs: new GetHealthLogs(healthLogRepository),
      createLog: new CreateHealthLog(healthLogRepository),
      deleteLog: new DeleteHealthLog(healthLogRepository),
    };
  }, []);

  const { data: groups, isLoading, error, refetch } = useFetcher(
    () => useCases.getLogs.execute(),
    [useCases],
    [] as DailyHealthLogGroup[],
    'health-logs',
  );

  const handleCreateLog = useCallback(async (input: CreateHealthLogInput) => {
    await useCases.createLog.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleDeleteLog = useCallback(async (logId: string) => {
    await useCases.deleteLog.execute(logId);
    await refetch();
  }, [useCases, refetch]);

  return {
    groups,
    isLoading,
    error,
    createLog: handleCreateLog,
    deleteLog: handleDeleteLog,
    refetch,
  };
};
