/**
 * サーバーサイド用 ワクチンリポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  VaccinationRepository,
  CreateVaccinationInput,
  UpdateVaccinationInput,
} from '@/domain/repositories/VaccinationRepository';
import { Vaccination } from '@/domain/entities/Vaccination';
import { QUERY_LIMITS } from '@/lib/constants';

function toVaccination(row: {
  id: string;
  userId: string;
  memberId: string;
  vaccineName: string;
  vaccinatedAt: Date;
  nextScheduledDate: Date | null;
  notes: string | null;
  createdAt: Date;
  member?: { name: string };
}): Vaccination {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name,
    vaccineName: row.vaccineName,
    vaccinatedAt: row.vaccinatedAt,
    nextScheduledDate: row.nextScheduledDate ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PrismaVaccinationRepository implements VaccinationRepository {
  constructor(private readonly userId: string) {}

  async getAll(): Promise<Vaccination[]> {
    const rows = await prisma.vaccination.findMany({
      where: { userId: this.userId },
      include: { member: { select: { name: true } } },
      orderBy: { vaccinatedAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toVaccination);
  }

  async create(input: CreateVaccinationInput): Promise<Vaccination> {
    const row = await prisma.vaccination.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        vaccineName: input.vaccineName,
        vaccinatedAt: new Date(input.vaccinatedAt),
        nextScheduledDate: input.nextScheduledDate ? new Date(input.nextScheduledDate) : undefined,
        notes: input.notes,
      },
      include: { member: { select: { name: true } } },
    });
    return toVaccination(row);
  }

  async update(id: string, input: UpdateVaccinationInput): Promise<Vaccination> {
    const existing = await prisma.vaccination.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('ワクチン記録が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.vaccineName !== undefined) data.vaccineName = input.vaccineName;
    if (input.vaccinatedAt !== undefined) data.vaccinatedAt = new Date(input.vaccinatedAt);
    if (input.nextScheduledDate !== undefined) {
      data.nextScheduledDate = input.nextScheduledDate ? new Date(input.nextScheduledDate) : null;
    }
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.vaccination.update({
      where: { id },
      data,
      include: { member: { select: { name: true } } },
    });
    return toVaccination(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.vaccination.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('ワクチン記録が見つかりません');
    }
    await prisma.vaccination.delete({ where: { id } });
  }
}
