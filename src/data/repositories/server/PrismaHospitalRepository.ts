/**
 * サーバーサイド用 病院リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  HospitalRepository,
  CreateHospitalInput,
  UpdateHospitalInput,
} from '@/domain/repositories/HospitalRepository';
import { Hospital } from '@/domain/entities/Hospital';
import { QUERY_LIMITS } from '@/lib/constants';

function toHospital(row: {
  id: string;
  userId: string;
  name: string;
  hospitalType: string | null;
  address: string | null;
  phoneNumber: string | null;
  department: string | null;
  doctorName: string | null;
  notes: string | null;
  createdAt: Date;
}): Hospital {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    hospitalType: row.hospitalType ?? undefined,
    address: row.address ?? undefined,
    phoneNumber: row.phoneNumber ?? undefined,
    department: row.department ?? undefined,
    doctorName: row.doctorName ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PrismaHospitalRepository implements HospitalRepository {
  constructor(private readonly userId: string) {}

  async findById(id: string): Promise<{ userId: string } | null> {
    return prisma.hospital.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }

  async getHospitals(): Promise<Hospital[]> {
    const rows = await prisma.hospital.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toHospital);
  }

  async createHospital(input: CreateHospitalInput): Promise<Hospital> {
    const row = await prisma.hospital.create({
      data: {
        userId: this.userId,
        name: input.name,
        hospitalType: input.type,
        address: input.address,
        phoneNumber: input.phone,
        department: input.department,
        doctorName: input.doctorName,
        notes: input.notes,
      },
    });
    return toHospital(row);
  }

  async updateHospital(hospitalId: string, input: UpdateHospitalInput): Promise<Hospital> {
    const existing = await prisma.hospital.findFirst({
      where: { id: hospitalId, userId: this.userId },
    });
    if (!existing) {
      throw new Error('病院が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.type !== undefined) data.hospitalType = input.type;
    if (input.address !== undefined) data.address = input.address;
    if (input.phone !== undefined) data.phoneNumber = input.phone;
    if (input.department !== undefined) data.department = input.department;
    if (input.doctorName !== undefined) data.doctorName = input.doctorName;
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.hospital.update({
      where: { id: hospitalId },
      data,
    });
    return toHospital(row);
  }

  async deleteHospital(hospitalId: string): Promise<void> {
    const existing = await prisma.hospital.findFirst({
      where: { id: hospitalId, userId: this.userId },
    });
    if (!existing) {
      throw new Error('病院が見つかりません');
    }
    await prisma.hospital.delete({ where: { id: hospitalId } });
  }
}
