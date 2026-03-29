import { useCallback, useMemo } from 'react';
import { NotificationSetting } from '../../domain/entities/NotificationSetting';
import { GetNotificationSetting, UpdateNotificationSetting } from '../../domain/usecases/ManageNotificationSettings';
import { UpdateNotificationSettingInput } from '../../domain/repositories/NotificationSettingRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseNotificationSettingsResult {
  setting: NotificationSetting | null;
  isLoading: boolean;
  error: Error | null;
  updateSetting: (input: UpdateNotificationSettingInput) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useNotificationSettings = (): UseNotificationSettingsResult => {
  const useCases = useMemo(() => {
    const { notificationSettingRepository } = getDIContainer();
    return {
      getSetting: new GetNotificationSetting(notificationSettingRepository),
      updateSetting: new UpdateNotificationSetting(notificationSettingRepository),
    };
  }, []);

  const { data: setting, isLoading, error, refetch } = useFetcher(
    async () => useCases.getSetting.execute(),
    [useCases],
    null as NotificationSetting | null,
    'notificationSettings',
  );

  const handleUpdate = useCallback(async (input: UpdateNotificationSettingInput) => {
    await useCases.updateSetting.execute(input);
    await refetch();
  }, [useCases, refetch]);

  return {
    setting,
    isLoading,
    error,
    updateSetting: handleUpdate,
    refetch,
  };
};
