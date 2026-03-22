/**
 * サーバーサイド用 体調記録リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  HealthLogRepository,
  CreateHealthLogInput,
} from '@/domain/repositories/HealthLogRepository';
import { HealthLog, ConditionLevel, SymptomType } from '@/domain/entities/HealthLog';
import { QUERY_LIMITS } from '@/lib/constants';

function toHealthLog(row: {
  id: string;
  userId: string;
  memberId: string;
  conditionLevel: number;
  symptoms: string[];
  notes: string | null;
  recordedAt: Date;
  member?: { name: string };
}): HealthLog {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name ?? '',
    conditionLevel: row.conditionLevel as ConditionLevel,
    symptoms: row.symptoms as SymptomType[],
    notes: row.notes ?? undefined,
    recordedAt: row.recordedAt,
  };
}

export class PrismaHealthLogRepository implements HealthLogRepository {
  constructor(private readonly userId: string) {}

  async getLogs(): Promise<HealthLog[]> {
    const rows = await prisma.healthLog.findMany({
      where: { userId: this.userId },
      include: { member: { select: { name: true } } },
      orderBy: { recordedAt: 'desc' },
      take: QUERY_LIMITS.RECORDS,
    });
    return rows.map(toHealthLog);
  }

  async createLog(input: CreateHealthLogInput): Promise<void> {
    await prisma.healthLog.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        conditionLevel: input.conditionLevel,
        symptoms: input.symptoms ?? [],
        notes: input.notes,
      },
    });
  }

  async deleteLog(logId: string): Promise<void> {
    const existing = await prisma.healthLog.findFirst({
      where: { id: logId, userId: this.userId },
    });
    if (!existing) {
      throw new Error('体調記録が見つかりません');
    }
    await prisma.healthLog.delete({ where: { id: logId } });
  }
}
