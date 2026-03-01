/**
 * ユーザープロフィールリポジトリの実装
 */

import {
  UserProfileRepository,
  UserProfile,
  UpdateUserProfileInput,
} from '../../domain/repositories/UserProfileRepository';
import { apiClient } from '../api/apiClient';

export class UserProfileRepositoryImpl implements UserProfileRepository {
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/users/me');
  }

  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/users/me', input);
  }
}
