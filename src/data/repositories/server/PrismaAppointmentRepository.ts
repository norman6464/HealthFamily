/**
 * サーバーサイド用 通院予約リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  AppointmentRepository,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/domain/repositories/AppointmentRepository';
import { Appointment } from '@/domain/entities/Appointment';
import { QUERY_LIMITS } from '@/lib/constants';

function toAppointment(row: {
  id: string;
  userId: string;
  memberId: string;
  hospitalId: string | null;
  appointmentType: string | null;
  appointmentDate: Date;
  description: string | null;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  createdAt: Date;
  member?: { name: string };
  hospital?: { name: string } | null;
}): Appointment {
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    memberName: row.member?.name,
    hospitalId: row.hospitalId ?? undefined,
    hospitalName: row.hospital?.name ?? undefined,
    appointmentType: row.appointmentType ?? undefined,
    appointmentDate: row.appointmentDate,
    description: row.description ?? undefined,
    reminderEnabled: row.reminderEnabled,
    reminderDaysBefore: row.reminderDaysBefore,
    createdAt: row.createdAt,
  };
}

export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly userId: string) {}

  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    const row = await prisma.appointment.findFirst({
      where: { id: appointmentId, userId: this.userId },
      include: {
        member: { select: { name: true } },
        hospital: { select: { name: true } },
      },
    });
    return row ? toAppointment(row) : null;
  }

  async getAppointments(): Promise<Appointment[]> {
    const rows = await prisma.appointment.findMany({
      where: { userId: this.userId },
      include: {
        member: { select: { name: true } },
        hospital: { select: { name: true } },
      },
      orderBy: { appointmentDate: 'asc' },
      take: QUERY_LIMITS.APPOINTMENTS,
    });
    return rows.map(toAppointment);
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const row = await prisma.appointment.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        hospitalId: input.hospitalId,
        appointmentType: input.type,
        appointmentDate: new Date(input.appointmentDate),
        description: input.notes,
        reminderEnabled: input.reminderEnabled ?? true,
        reminderDaysBefore: input.reminderDaysBefore ?? 1,
      },
      include: {
        member: { select: { name: true } },
        hospital: { select: { name: true } },
      },
    });
    return toAppointment(row);
  }

  async updateAppointment(appointmentId: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, userId: this.userId },
    });
    if (!existing) {
      throw new Error('予約が見つかりません');
    }

    const data: Record<string, unknown> = {};
    if (input.appointmentDate !== undefined) data.appointmentDate = new Date(input.appointmentDate);
    if (input.hospitalId !== undefined) data.hospitalId = input.hospitalId;
    if (input.type !== undefined) data.appointmentType = input.type;
    if (input.notes !== undefined) data.description = input.notes;
    if (input.reminderEnabled !== undefined) data.reminderEnabled = input.reminderEnabled;
    if (input.reminderDaysBefore !== undefined) data.reminderDaysBefore = input.reminderDaysBefore;

    const row = await prisma.appointment.update({
      where: { id: appointmentId },
      data,
      include: {
        member: { select: { name: true } },
        hospital: { select: { name: true } },
      },
    });
    return toAppointment(row);
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, userId: this.userId },
    });
    if (!existing) {
      throw new Error('予約が見つかりません');
    }
    await prisma.appointment.delete({ where: { id: appointmentId } });
  }
}
