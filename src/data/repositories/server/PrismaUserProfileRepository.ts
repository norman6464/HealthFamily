/**
 * サーバーサイド用 ユーザープロフィールリポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  UserProfileRepository,
  UserProfile,
  UpdateUserProfileInput,
} from '@/domain/repositories/UserProfileRepository';

const USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  characterType: true,
  characterName: true,
} as const;

export class PrismaUserProfileRepository implements UserProfileRepository {
  constructor(private readonly userId: string) {}

  async getProfile(): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: USER_SELECT,
    });
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      characterType: user.characterType,
      characterName: user.characterName,
    };
  }

  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    const updated = await prisma.user.update({
      where: { id: this.userId },
      data: { displayName: input.displayName },
      select: USER_SELECT,
    });
    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      characterType: updated.characterType,
      characterName: updated.characterName,
    };
  }
}
