import { Member, MemberType } from '../../domain/entities/Member';
import { Medication, MedicationCategory } from '../../domain/entities/Medication';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { BackendMember, BackendMedication, BackendSchedule } from './types';

export function toMember(b: BackendMember): Member {
  return {
    id: b.memberId,
    userId: b.userId,
    memberType: (b.memberType as MemberType) || 'human',
    name: b.name,
    petType: b.petType as Member['petType'],
    birthDate: b.birthDate ? new Date(b.birthDate) : undefined,
    notes: b.notes,
    createdAt: new Date(b.createdAt),
    updatedAt: new Date(b.updatedAt),
  };
}

export function toMedication(b: BackendMedication): Medication {
  return {
    id: b.medicationId,
    memberId: b.memberId,
    userId: b.userId,
    name: b.name,
    category: (b.category as MedicationCategory) || 'regular',
    dosage: b.dosageAmount,
    frequency: b.frequency,
    stockQuantity: b.stockQuantity,
    lowStockThreshold: b.lowStockThreshold,
    instructions: b.instructions,
    isActive: b.isActive ?? true,
    createdAt: new Date(b.createdAt),
    updatedAt: new Date(b.updatedAt),
  };
}

export function toSchedule(b: BackendSchedule): Schedule {
  return {
    id: b.scheduleId,
    medicationId: b.medicationId,
    userId: b.userId,
    memberId: b.memberId,
    scheduledTime: b.scheduledTime,
    daysOfWeek: (b.daysOfWeek as DayOfWeek[]) || [],
    isEnabled: b.isEnabled ?? true,
    reminderMinutesBefore: b.reminderMinutesBefore ?? 10,
    createdAt: new Date(b.createdAt),
  };
}
