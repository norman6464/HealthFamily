/**
 * サーバーサイド用 身体測定リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  BodyMeasurementRepository,
  CreateBodyMeasurementInput,
  UpdateBodyMeasurementInput,
} from '@/domain/repositories/BodyMeasurementRepository';
import { BodyMeasurement } from '@/domain/entities/BodyMeasurement';
import { QUERY_LIMITS } from '@/lib/constants';

function toBodyMeasurement(row: {
  id: string;
  userId: string;
  memberId: string;
  weight: number | null;
  height: number | null;
  recordedAt: Date;
  notes: string | null;
  createdAt: Date;
  member?: { name: string };
}): BodyMeasurement {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name,
    weight: row.weight ?? undefined,
    height: row.height ?? undefined,
    recordedAt: row.recordedAt,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PrismaBodyMeasurementRepository implements BodyMeasurementRepository {
  constructor(private readonly userId: string) {}

  async getAll(): Promise<BodyMeasurement[]> {
    const rows = await prisma.bodyMeasurement.findMany({
      where: { userId: this.userId },
      include: { member: { select: { name: true } } },
      orderBy: { recordedAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toBodyMeasurement);
  }

  async create(input: CreateBodyMeasurementInput): Promise<BodyMeasurement> {
    const row = await prisma.bodyMeasurement.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        weight: input.weight,
        height: input.height,
        recordedAt: new Date(input.recordedAt),
        notes: input.notes,
      },
      include: { member: { select: { name: true } } },
    });
    return toBodyMeasurement(row);
  }

  async update(id: string, input: UpdateBodyMeasurementInput): Promise<BodyMeasurement> {
    const existing = await prisma.bodyMeasurement.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('身体測定記録が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.weight !== undefined) data.weight = input.weight;
    if (input.height !== undefined) data.height = input.height;
    if (input.recordedAt !== undefined) data.recordedAt = new Date(input.recordedAt);
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.bodyMeasurement.update({
      where: { id },
      data,
      include: { member: { select: { name: true } } },
    });
    return toBodyMeasurement(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.bodyMeasurement.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('身体測定記録が見つかりません');
    }
    await prisma.bodyMeasurement.delete({ where: { id } });
  }
}
