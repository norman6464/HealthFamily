/**
 * サーバーサイド用 緊急連絡先リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  EmergencyContactRepository,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from '@/domain/repositories/EmergencyContactRepository';
import { EmergencyContact } from '@/domain/entities/EmergencyContact';
import { QUERY_LIMITS } from '@/lib/constants';

function toEmergencyContact(row: {
  id: string;
  userId: string;
  memberId: string;
  contactName: string;
  phoneNumber: string;
  relationship: string | null;
  notes: string | null;
  createdAt: Date;
  member?: { name: string };
}): EmergencyContact {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name,
    contactName: row.contactName,
    phoneNumber: row.phoneNumber,
    relationship: row.relationship ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PrismaEmergencyContactRepository implements EmergencyContactRepository {
  constructor(private readonly userId: string) {}

  async getAll(): Promise<EmergencyContact[]> {
    const rows = await prisma.emergencyContact.findMany({
      where: { userId: this.userId },
      include: { member: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return rows.map(toEmergencyContact);
  }

  async create(input: CreateEmergencyContactInput): Promise<EmergencyContact> {
    const row = await prisma.emergencyContact.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        contactName: input.contactName,
        phoneNumber: input.phoneNumber,
        relationship: input.relationship,
        notes: input.notes,
      },
      include: { member: { select: { name: true } } },
    });
    return toEmergencyContact(row);
  }

  async update(id: string, input: UpdateEmergencyContactInput): Promise<EmergencyContact> {
    const existing = await prisma.emergencyContact.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('緊急連絡先が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.contactName !== undefined) data.contactName = input.contactName;
    if (input.phoneNumber !== undefined) data.phoneNumber = input.phoneNumber;
    if (input.relationship !== undefined) data.relationship = input.relationship;
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.emergencyContact.update({
      where: { id },
      data,
      include: { member: { select: { name: true } } },
    });
    return toEmergencyContact(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.emergencyContact.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('緊急連絡先が見つかりません');
    }
    await prisma.emergencyContact.delete({ where: { id } });
  }
}
