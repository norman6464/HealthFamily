/**
 * 体調記録リポジトリの実装
 */

import {
  HealthLogRepository,
  CreateHealthLogInput,
} from '../../domain/repositories/HealthLogRepository';
import { HealthLog } from '../../domain/entities/HealthLog';
import { healthLogApi } from '../api/healthLogApi';

export class HealthLogRepositoryImpl implements HealthLogRepository {
  async findById(_id: string): Promise<{ userId: string } | null> {
    throw new Error('findById はサーバーサイド専用です');
  }

  async getLogs(): Promise<HealthLog[]> {
    return healthLogApi.getLogs();
  }

  async createLog(input: CreateHealthLogInput): Promise<void> {
    await healthLogApi.createLog(input);
  }

  async deleteLog(logId: string): Promise<void> {
    await healthLogApi.deleteLog(logId);
  }
}
