/**
 * サーバーサイド用 保険リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  InsuranceRepository,
  CreateInsuranceInput,
  UpdateInsuranceInput,
} from '@/domain/repositories/InsuranceRepository';
import { Insurance } from '@/domain/entities/Insurance';
import { QUERY_LIMITS } from '@/lib/constants';

function toInsurance(row: {
  id: string;
  userId: string;
  memberId: string;
  insuranceType: string;
  providerName: string | null;
  policyNumber: string | null;
  notes: string | null;
  createdAt: Date;
  member?: { name: string };
}): Insurance {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name,
    insuranceType: row.insuranceType,
    providerName: row.providerName ?? undefined,
    policyNumber: row.policyNumber ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PrismaInsuranceRepository implements InsuranceRepository {
  constructor(private readonly userId: string) {}

  async findById(id: string): Promise<{ userId: string } | null> {
    return prisma.insurance.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }

  async getAll(): Promise<Insurance[]> {
    const rows = await prisma.insurance.findMany({
      where: { userId: this.userId },
      include: { member: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toInsurance);
  }

  async create(input: CreateInsuranceInput): Promise<Insurance> {
    const row = await prisma.insurance.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        insuranceType: input.insuranceType,
        providerName: input.providerName,
        policyNumber: input.policyNumber,
        notes: input.notes,
      },
      include: { member: { select: { name: true } } },
    });
    return toInsurance(row);
  }

  async update(id: string, input: UpdateInsuranceInput): Promise<Insurance> {
    const existing = await prisma.insurance.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('保険情報が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.insuranceType !== undefined) data.insuranceType = input.insuranceType;
    if (input.providerName !== undefined) data.providerName = input.providerName;
    if (input.policyNumber !== undefined) data.policyNumber = input.policyNumber;
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.insurance.update({
      where: { id },
      data,
      include: { member: { select: { name: true } } },
    });
    return toInsurance(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.insurance.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('保険情報が見つかりません');
    }
    await prisma.insurance.delete({ where: { id } });
  }
}
