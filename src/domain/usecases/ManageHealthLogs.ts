/**
 * 体調記録管理ユースケース
 */

import { HealthLogEntity, DailyHealthLogGroup } from '../entities/HealthLog';
import {
  HealthLogRepository,
  CreateHealthLogInput,
} from '../repositories/HealthLogRepository';

export class GetHealthLogs {
  constructor(private readonly healthLogRepository: HealthLogRepository) {}

  async execute(): Promise<DailyHealthLogGroup[]> {
    const logs = await this.healthLogRepository.getLogs();
    return HealthLogEntity.groupByDate(logs);
  }
}

export class CreateHealthLog {
  constructor(private readonly healthLogRepository: HealthLogRepository) {}

  async execute(input: CreateHealthLogInput): Promise<void> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (input.conditionLevel < 1 || input.conditionLevel > 5) {
      throw new Error('体調レベルは1-5の範囲で指定してください');
    }
    return this.healthLogRepository.createLog(input);
  }
}

export class DeleteHealthLog {
  constructor(private readonly healthLogRepository: HealthLogRepository) {}

  async execute(logId: string): Promise<void> {
    if (!logId) {
      throw new Error('記録IDは必須です');
    }
    return this.healthLogRepository.deleteLog(logId);
  }
}
