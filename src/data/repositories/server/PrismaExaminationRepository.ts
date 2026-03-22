/**
 * サーバーサイド用 検査リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  ExaminationRepository,
  CreateExaminationInput,
  UpdateExaminationInput,
} from '@/domain/repositories/ExaminationRepository';
import { Examination } from '@/domain/entities/Examination';
import { QUERY_LIMITS } from '@/lib/constants';

function toExamination(row: {
  id: string;
  userId: string;
  memberId: string;
  examinationType: string;
  examinedAt: Date;
  nextScheduledDate: Date | null;
  notes: string | null;
  createdAt: Date;
  member?: { name: string };
}): Examination {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name,
    examinationType: row.examinationType,
    examinedAt: row.examinedAt,
    nextScheduledDate: row.nextScheduledDate ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PrismaExaminationRepository implements ExaminationRepository {
  constructor(private readonly userId: string) {}

  async getAll(): Promise<Examination[]> {
    const rows = await prisma.examination.findMany({
      where: { userId: this.userId },
      include: { member: { select: { name: true } } },
      orderBy: { examinedAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toExamination);
  }

  async create(input: CreateExaminationInput): Promise<Examination> {
    const row = await prisma.examination.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        examinationType: input.examinationType,
        examinedAt: new Date(input.examinedAt),
        nextScheduledDate: input.nextScheduledDate ? new Date(input.nextScheduledDate) : undefined,
        notes: input.notes,
      },
      include: { member: { select: { name: true } } },
    });
    return toExamination(row);
  }

  async update(id: string, input: UpdateExaminationInput): Promise<Examination> {
    const existing = await prisma.examination.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('検査記録が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.examinationType !== undefined) data.examinationType = input.examinationType;
    if (input.examinedAt !== undefined) data.examinedAt = new Date(input.examinedAt);
    if (input.nextScheduledDate !== undefined) {
      data.nextScheduledDate = input.nextScheduledDate ? new Date(input.nextScheduledDate) : null;
    }
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.examination.update({
      where: { id },
      data,
      include: { member: { select: { name: true } } },
    });
    return toExamination(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.examination.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('検査記録が見つかりません');
    }
    await prisma.examination.delete({ where: { id } });
  }
}
