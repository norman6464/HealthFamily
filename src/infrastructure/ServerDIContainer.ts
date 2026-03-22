/**
 * サーバーサイド用DIコンテナ
 * APIルートからUsecase経由でPrismaリポジトリを使用するためのファクトリ
 * フロントエンド用のDIContainer（API経由）とは別に、サーバーサイドではPrisma直接アクセスを行う
 */

import { MedicationRepository } from '@/domain/repositories/MedicationRepository';
import { ScheduleRepository } from '@/domain/repositories/ScheduleRepository';
import { PrismaMedicationRepository } from '@/data/repositories/server/PrismaMedicationRepository';
import { PrismaScheduleRepository } from '@/data/repositories/server/PrismaScheduleRepository';

export interface ServerDIContainer {
  medicationRepository: MedicationRepository;
  scheduleRepository: ScheduleRepository;
}

/**
 * ユーザーIDに紐づくサーバーサイドDIコンテナを生成する
 * APIルートのリクエストごとに新規作成される（ユーザーごとのスコープ）
 */
export function createServerDIContainer(userId: string): ServerDIContainer {
  return {
    medicationRepository: new PrismaMedicationRepository(userId),
    scheduleRepository: new PrismaScheduleRepository(userId),
  };
}
