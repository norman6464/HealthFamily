/**
 * ユーザープロフィールリポジトリの実装
 */

import {
  UserProfileRepository,
  UserProfile,
  UpdateUserProfileInput,
} from '../../domain/repositories/UserProfileRepository';
import { userProfileApi } from '../api/userProfileApi';

export class UserProfileRepositoryImpl implements UserProfileRepository {
  async getProfile(): Promise<UserProfile> {
    return userProfileApi.getProfile();
  }

  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    return userProfileApi.updateProfile(input);
  }
}
