/**
 * サーバーサイド用 体温記録リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  TemperatureRecordRepository,
  CreateTemperatureRecordInput,
  UpdateTemperatureRecordInput,
} from '@/domain/repositories/TemperatureRecordRepository';
import { TemperatureRecord } from '@/domain/entities/TemperatureRecord';
import { QUERY_LIMITS } from '@/lib/constants';

function toTemperatureRecord(row: {
  id: string;
  userId: string;
  memberId: string;
  temperature: number;
  measuredAt: Date;
  notes: string | null;
  createdAt: Date;
  member?: { name: string };
}): TemperatureRecord {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name,
    temperature: row.temperature,
    measuredAt: row.measuredAt,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PrismaTemperatureRecordRepository implements TemperatureRecordRepository {
  constructor(private readonly userId: string) {}

  async findById(id: string): Promise<{ userId: string } | null> {
    return prisma.temperatureRecord.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }

  async getAll(): Promise<TemperatureRecord[]> {
    const rows = await prisma.temperatureRecord.findMany({
      where: { userId: this.userId },
      include: { member: { select: { name: true } } },
      orderBy: { measuredAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toTemperatureRecord);
  }

  async getByMember(memberId: string): Promise<TemperatureRecord[]> {
    const rows = await prisma.temperatureRecord.findMany({
      where: { userId: this.userId, memberId },
      include: { member: { select: { name: true } } },
      orderBy: { measuredAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toTemperatureRecord);
  }

  async create(input: CreateTemperatureRecordInput): Promise<TemperatureRecord> {
    const row = await prisma.temperatureRecord.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        temperature: input.temperature,
        measuredAt: new Date(input.measuredAt),
        notes: input.notes,
      },
      include: { member: { select: { name: true } } },
    });
    return toTemperatureRecord(row);
  }

  async update(id: string, input: UpdateTemperatureRecordInput): Promise<TemperatureRecord> {
    const existing = await prisma.temperatureRecord.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('体温記録が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.temperature !== undefined) data.temperature = input.temperature;
    if (input.measuredAt !== undefined) data.measuredAt = new Date(input.measuredAt);
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.temperatureRecord.update({
      where: { id },
      data,
      include: { member: { select: { name: true } } },
    });
    return toTemperatureRecord(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.temperatureRecord.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('体温記録が見つかりません');
    }
    await prisma.temperatureRecord.delete({ where: { id } });
  }
}
