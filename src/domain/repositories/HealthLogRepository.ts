/**
 * 体調記録リポジトリインターフェース
 */

import { HealthLog } from '../entities/HealthLog';

export interface CreateHealthLogInput {
  memberId: string;
  conditionLevel: number;
  symptoms?: string[];
  notes?: string;
}

export interface HealthLogRepository {
  getLogs(): Promise<HealthLog[]>;
  createLog(input: CreateHealthLogInput): Promise<void>;
  deleteLog(logId: string): Promise<void>;
}
