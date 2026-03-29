/**
 * サーバーサイド用 処方箋リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  PrescriptionRepository,
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
} from '@/domain/repositories/PrescriptionRepository';
import { Prescription } from '@/domain/entities/Prescription';
import { QUERY_LIMITS } from '@/lib/constants';

function toPrescription(row: {
  id: string;
  userId: string;
  memberId: string;
  prescriptionName: string;
  prescribedBy: string | null;
  prescribedAt: Date;
  expiresAt: Date | null;
  pharmacyName: string | null;
  notes: string | null;
  createdAt: Date;
  member?: { name: string };
}): Prescription {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name,
    prescriptionName: row.prescriptionName,
    prescribedBy: row.prescribedBy ?? undefined,
    prescribedAt: row.prescribedAt,
    expiresAt: row.expiresAt ?? undefined,
    pharmacyName: row.pharmacyName ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PrismaPrescriptionRepository implements PrescriptionRepository {
  constructor(private readonly userId: string) {}

  async findById(id: string): Promise<{ userId: string } | null> {
    return prisma.prescription.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }

  async getAll(): Promise<Prescription[]> {
    const rows = await prisma.prescription.findMany({
      where: { userId: this.userId },
      include: { member: { select: { name: true } } },
      orderBy: { prescribedAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toPrescription);
  }

  async create(input: CreatePrescriptionInput): Promise<Prescription> {
    const row = await prisma.prescription.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        prescriptionName: input.prescriptionName,
        prescribedBy: input.prescribedBy,
        prescribedAt: new Date(input.prescribedAt),
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        pharmacyName: input.pharmacyName,
        notes: input.notes,
      },
      include: { member: { select: { name: true } } },
    });
    return toPrescription(row);
  }

  async update(id: string, input: UpdatePrescriptionInput): Promise<Prescription> {
    const existing = await prisma.prescription.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('処方箋が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.prescriptionName !== undefined) data.prescriptionName = input.prescriptionName;
    if (input.prescribedBy !== undefined) data.prescribedBy = input.prescribedBy;
    if (input.prescribedAt !== undefined) data.prescribedAt = new Date(input.prescribedAt);
    if (input.expiresAt !== undefined) {
      data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    }
    if (input.pharmacyName !== undefined) data.pharmacyName = input.pharmacyName;
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.prescription.update({
      where: { id },
      data,
      include: { member: { select: { name: true } } },
    });
    return toPrescription(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.prescription.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('処方箋が見つかりません');
    }
    await prisma.prescription.delete({ where: { id } });
  }
}
