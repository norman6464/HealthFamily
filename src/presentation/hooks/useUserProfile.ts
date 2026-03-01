/**
 * ユーザープロフィール管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, UpdateUserProfileInput } from '../../domain/repositories/UserProfileRepository';
import { GetUserProfile, UpdateUserProfile } from '../../domain/usecases/ManageUserProfile';
import { getDIContainer } from '../../infrastructure/DIContainer';

export interface UseUserProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (input: UpdateUserProfileInput) => Promise<UserProfile>;
  refetch: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileResult => {
  const useCases = useMemo(() => {
    const { userProfileRepository } = getDIContainer();
    return {
      getProfile: new GetUserProfile(userProfileRepository),
      updateProfile: new UpdateUserProfile(userProfileRepository),
    };
  }, []);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await useCases.getProfile.execute();
      setProfile(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [useCases]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (input: UpdateUserProfileInput): Promise<UserProfile> => {
    const updated = await useCases.updateProfile.execute(input);
    setProfile(updated);
    return updated;
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile: handleUpdateProfile,
    refetch: fetchProfile,
  };
};
