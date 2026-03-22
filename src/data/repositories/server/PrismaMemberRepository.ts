/**
 * サーバーサイド用 メンバーリポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  MemberRepository,
  CreateMemberInput,
  UpdateMemberInput,
} from '@/domain/repositories/MemberRepository';
import { Member, MemberType, PetType } from '@/domain/entities/Member';
import { MemberSummary } from '@/domain/entities/MemberSummary';
import { MemberProfile } from '@/domain/entities/MemberProfile';
import { DateRangeHelper } from '@/domain/entities/DateRange';
import { QUERY_LIMITS } from '@/lib/constants';

function toMember(row: {
  id: string;
  userId: string;
  memberType: string;
  name: string;
  petType: string | null;
  photoUrl: string | null;
  birthDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Member {
  return {
    id: row.id,
    userId: row.userId,
    memberType: row.memberType as MemberType,
    name: row.name,
    petType: (row.petType as PetType) ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    birthDate: row.birthDate ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaMemberRepository implements MemberRepository {
  constructor(private readonly userId: string) {}

  async getMembers(_userId: string): Promise<Member[]> {
    const rows = await prisma.member.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: 'asc' },
      take: QUERY_LIMITS.MEMBERS,
    });
    return rows.map(toMember);
  }

  async getMemberById(memberId: string): Promise<Member | null> {
    const row = await prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!row || row.userId !== this.userId) return null;
    return toMember(row);
  }

  async createMember(input: CreateMemberInput): Promise<Member> {
    const row = await prisma.member.create({
      data: {
        userId: this.userId,
        name: input.name,
        memberType: input.memberType ?? 'human',
        petType: input.petType,
        birthDate: input.birthDate,
        notes: input.notes,
      },
    });
    return toMember(row);
  }

  async updateMember(memberId: string, input: UpdateMemberInput): Promise<Member> {
    const existing = await prisma.member.findFirst({
      where: { id: memberId, userId: this.userId },
    });
    if (!existing) {
      throw new Error('メンバーが見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.petType !== undefined) data.petType = input.petType;
    if (input.birthDate !== undefined) data.birthDate = input.birthDate;
    if (input.notes !== undefined) data.notes = input.notes;

    const row = await prisma.member.update({
      where: { id: memberId },
      data,
    });
    return toMember(row);
  }

  async deleteMember(memberId: string): Promise<void> {
    const existing = await prisma.member.findFirst({
      where: { id: memberId, userId: this.userId },
    });
    if (!existing) {
      throw new Error('メンバーが見つかりません');
    }
    await prisma.member.delete({ where: { id: memberId } });
  }

  async getMemberSummaries(): Promise<MemberSummary[]> {
    const [members, medications, appointments] = await Promise.all([
      prisma.member.findMany({
        where: { userId: this.userId },
        select: { id: true, name: true, memberType: true },
        take: QUERY_LIMITS.MEMBERS,
      }),
      prisma.medication.findMany({
        where: { userId: this.userId, isActive: true },
        select: { memberId: true },
        take: QUERY_LIMITS.SCHEDULES,
      }),
      prisma.appointment.findMany({
        where: { userId: this.userId, appointmentDate: { gte: new Date() } },
        select: { memberId: true, appointmentDate: true },
        orderBy: { appointmentDate: 'asc' },
        take: QUERY_LIMITS.APPOINTMENTS,
      }),
    ]);

    return members.map((member) => {
      const medicationCount = medications.filter((m) => m.memberId === member.id).length;
      const nextAppointment = appointments.find((a) => a.memberId === member.id);

      return {
        memberId: member.id,
        memberName: member.name,
        memberType: member.memberType,
        medicationCount,
        nextAppointmentDate: nextAppointment?.appointmentDate.toISOString() ?? null,
      };
    });
  }

  async getMemberProfile(memberId: string): Promise<MemberProfile | null> {
    const row = await prisma.member.findUnique({ where: { id: memberId } });
    if (!row || row.userId !== this.userId) return null;

    const member = toMember(row);

    const [medicationCount, activeScheduleCount, upcomingAppointmentCount] = await Promise.all([
      prisma.medication.count({ where: { memberId, userId: this.userId, isActive: true } }),
      prisma.schedule.count({ where: { memberId, userId: this.userId, isEnabled: true } }),
      prisma.appointment.count({
        where: { memberId, userId: this.userId, appointmentDate: { gte: new Date() } },
      }),
    ]);

    const sevenDaysAgo = DateRangeHelper.daysAgo(7);

    const [recordCount, scheduleCount] = await Promise.all([
      prisma.medicationRecord.count({ where: { memberId, userId: this.userId, takenAt: { gte: sevenDaysAgo } } }),
      prisma.schedule.count({ where: { memberId, userId: this.userId, isEnabled: true } }),
    ]);

    const expectedRecords = scheduleCount * 7;
    const recentAdherenceRate = expectedRecords > 0
      ? Math.round((recordCount / expectedRecords) * 100)
      : null;

    return {
      member,
      medicationCount,
      activeScheduleCount,
      upcomingAppointmentCount,
      recentAdherenceRate,
    };
  }
}
