/**
 * サーバーサイド用 アレルギーリポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  AllergyRepository,
  CreateAllergyInput,
  UpdateAllergyInput,
} from '@/domain/repositories/AllergyRepository';
import { Allergy } from '@/domain/entities/Allergy';
import { QUERY_LIMITS } from '@/lib/constants';

function toAllergy(row: {
  id: string;
  userId: string;
  memberId: string;
  allergenName: string;
  allergyType: string;
  severity: string;
  symptoms: string | null;
  diagnosedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  member?: { name: string };
}): Allergy {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name,
    allergenName: row.allergenName,
    allergyType: row.allergyType,
    severity: row.severity,
    symptoms: row.symptoms ?? undefined,
    diagnosedAt: row.diagnosedAt ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PrismaAllergyRepository implements AllergyRepository {
  constructor(private readonly userId: string) {}

  async findById(id: string): Promise<{ userId: string } | null> {
    return prisma.allergy.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }

  async getAll(): Promise<Allergy[]> {
    const rows = await prisma.allergy.findMany({
      where: { userId: this.userId },
      include: { member: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toAllergy);
  }

  async create(input: CreateAllergyInput): Promise<Allergy> {
    const row = await prisma.allergy.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        allergenName: input.allergenName,
        allergyType: input.allergyType,
        severity: input.severity,
        symptoms: input.symptoms,
        diagnosedAt: input.diagnosedAt ? new Date(input.diagnosedAt) : undefined,
        notes: input.notes,
      },
      include: { member: { select: { name: true } } },
    });
    return toAllergy(row);
  }

  async update(id: string, input: UpdateAllergyInput): Promise<Allergy> {
    const existing = await prisma.allergy.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('アレルギー情報が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.allergenName !== undefined) data.allergenName = input.allergenName;
    if (input.allergyType !== undefined) data.allergyType = input.allergyType;
    if (input.severity !== undefined) data.severity = input.severity;
    if (input.symptoms !== undefined) data.symptoms = input.symptoms;
    if (input.diagnosedAt !== undefined) {
      data.diagnosedAt = input.diagnosedAt ? new Date(input.diagnosedAt) : null;
    }
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.allergy.update({
      where: { id },
      data,
      include: { member: { select: { name: true } } },
    });
    return toAllergy(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.allergy.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('アレルギー情報が見つかりません');
    }
    await prisma.allergy.delete({ where: { id } });
  }
}
