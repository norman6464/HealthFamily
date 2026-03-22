/**
 * サーバーサイド用 薬リポジトリ実装（Prisma）
 * APIルートからUsecase経由で使用される
 */

import { prisma } from '@/lib/prisma';
import {
  MedicationRepository,
  CreateMedicationInput,
  UpdateMedicationInput,
} from '@/domain/repositories/MedicationRepository';
import { Medication, MedicationCategory } from '@/domain/entities/Medication';
import { MedicationSearchResult } from '@/domain/entities/MedicationSearchResult';
import { StockAlert } from '@/domain/entities/StockAlert';
import { StockAlertEntity } from '@/domain/entities/StockAlert';
import { QUERY_LIMITS } from '@/lib/constants';

function toMedication(row: {
  id: string;
  memberId: string;
  userId: string;
  name: string;
  category: string;
  dosageAmount: string | null;
  frequency: string | null;
  stockQuantity: number | null;
  stockAlertDate: Date | null;
  intervalHours: number | null;
  instructions: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Medication {
  return {
    id: row.id,
    memberId: row.memberId,
    userId: row.userId,
    name: row.name,
    category: row.category as MedicationCategory,
    dosage: row.dosageAmount ?? undefined,
    frequency: row.frequency ?? undefined,
    stockQuantity: row.stockQuantity ?? undefined,
    stockAlertDate: row.stockAlertDate ?? undefined,
    intervalHours: row.intervalHours ?? undefined,
    instructions: row.instructions ?? undefined,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaMedicationRepository implements MedicationRepository {
  constructor(private readonly userId: string) {}

  async getMedicationsByMember(memberId: string): Promise<Medication[]> {
    const rows = await prisma.medication.findMany({
      where: { memberId, userId: this.userId },
      orderBy: { displayOrder: 'asc' },
      take: QUERY_LIMITS.APPOINTMENTS,
    });
    return rows.map(toMedication);
  }

  async getMedicationById(medicationId: string): Promise<Medication | null> {
    const row = await prisma.medication.findUnique({
      where: { id: medicationId },
    });
    if (!row || row.userId !== this.userId) return null;
    return toMedication(row);
  }

  async createMedication(input: CreateMedicationInput): Promise<Medication> {
    const row = await prisma.medication.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        name: input.name,
        category: input.category ?? 'regular',
        dosageAmount: input.dosage,
        frequency: input.frequency,
        stockQuantity: input.stockQuantity,
        stockAlertDate: input.stockAlertDate ? new Date(input.stockAlertDate) : undefined,
        instructions: input.instructions,
        isActive: true,
      },
    });
    return toMedication(row);
  }

  async updateMedication(medicationId: string, input: UpdateMedicationInput): Promise<Medication> {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.dosage !== undefined) data.dosageAmount = input.dosage;
    if (input.frequency !== undefined) data.frequency = input.frequency;
    if (input.stockQuantity !== undefined) data.stockQuantity = input.stockQuantity;
    if (input.stockAlertDate !== undefined) {
      data.stockAlertDate = input.stockAlertDate ? new Date(input.stockAlertDate) : null;
    }
    if (input.instructions !== undefined) data.instructions = input.instructions;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const row = await prisma.medication.update({
      where: { id: medicationId },
      data,
    });
    return toMedication(row);
  }

  async deleteMedication(medicationId: string): Promise<void> {
    await prisma.medication.delete({ where: { id: medicationId } });
  }

  async reorderMedications(medicationIds: string[]): Promise<void> {
    const medications = await prisma.medication.findMany({
      where: { id: { in: medicationIds }, userId: this.userId },
      select: { id: true },
    });

    const ownedIds = new Set(medications.map((m) => m.id));
    const allOwned = medicationIds.every((id) => ownedIds.has(id));
    if (!allOwned) {
      throw new Error('権限がありません');
    }

    await prisma.$transaction(
      medicationIds.map((id, index) =>
        prisma.medication.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );
  }

  async searchMedications(query: string): Promise<MedicationSearchResult[]> {
    const medications = await prisma.medication.findMany({
      where: {
        userId: this.userId,
        isActive: true,
        name: { contains: query, mode: 'insensitive' },
      },
      include: { member: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
      take: QUERY_LIMITS.DEFAULT,
    });

    return medications.map((med) => ({
      id: med.id,
      name: med.name,
      category: med.category,
      memberId: med.memberId,
      memberName: med.member.name,
      dosageAmount: med.dosageAmount ?? undefined,
      frequency: med.frequency ?? undefined,
      stockQuantity: med.stockQuantity ?? undefined,
    }));
  }

  async getStockAlerts(): Promise<StockAlert[]> {
    const now = new Date();

    const [medications, schedules] = await Promise.all([
      prisma.medication.findMany({
        where: {
          userId: this.userId,
          isActive: true,
          stockAlertDate: { not: null },
        },
        include: { member: { select: { id: true, name: true } } },
        orderBy: { stockAlertDate: 'asc' },
        take: QUERY_LIMITS.SCHEDULES,
      }),
      prisma.schedule.findMany({
        where: { userId: this.userId, isEnabled: true },
        select: { medicationId: true },
        take: QUERY_LIMITS.RECORDS,
      }),
    ]);

    const scheduleCountByMed = new Map<string, number>();
    for (const s of schedules) {
      scheduleCountByMed.set(s.medicationId, (scheduleCountByMed.get(s.medicationId) ?? 0) + 1);
    }

    return medications
      .filter((med) => {
        if (!med.stockAlertDate) return false;
        const daysUntil = Math.ceil((med.stockAlertDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 14;
      })
      .map((med) => {
        const daysUntil = Math.ceil((med.stockAlertDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const dailyConsumption = scheduleCountByMed.get(med.id) ?? 0;
        const remainingDays = StockAlertEntity.calculateRemainingDays(med.stockQuantity, dailyConsumption);

        return {
          medicationId: med.id,
          medicationName: med.name,
          memberId: med.memberId,
          memberName: med.member.name,
          stockQuantity: med.stockQuantity,
          stockAlertDate: med.stockAlertDate!.toISOString(),
          daysUntilAlert: daysUntil,
          isOverdue: daysUntil <= 0,
          remainingDays,
        };
      });
  }
}
