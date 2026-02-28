/**
 * 依存性注入コンテナ
 * Domain層のリポジトリインターフェースにData層の実装を紐づける
 */

import { MemberRepository } from '../domain/repositories/MemberRepository';
import { MedicationRepository } from '../domain/repositories/MedicationRepository';
import { ScheduleRepository } from '../domain/repositories/ScheduleRepository';
import { MemberRepositoryImpl } from '../data/repositories/MemberRepositoryImpl';
import { MedicationRepositoryImpl } from '../data/repositories/MedicationRepositoryImpl';
import { ScheduleRepositoryImpl } from '../data/repositories/ScheduleRepositoryImpl';

export interface DIContainer {
  memberRepository: MemberRepository;
  medicationRepository: MedicationRepository;
  scheduleRepository: ScheduleRepository;
}

// シングルトンコンテナ（テスト時にモックに差し替え可能）
let container: DIContainer | null = null;

export const getDIContainer = (): DIContainer => {
  if (!container) {
    container = {
      memberRepository: new MemberRepositoryImpl(),
      medicationRepository: new MedicationRepositoryImpl(),
      scheduleRepository: new ScheduleRepositoryImpl(),
    };
  }
  return container;
};

// テスト用: DIコンテナを差し替え
export const setDIContainer = (newContainer: DIContainer): void => {
  container = newContainer;
};

// テスト用: DIコンテナをリセット
export const resetDIContainer = (): void => {
  container = null;
};
