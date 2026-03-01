import { Member, MemberType } from '../../domain/entities/Member';
import { Medication, MedicationCategory } from '../../domain/entities/Medication';
import { MedicationRecord } from '../../domain/entities/MedicationRecord';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { BackendMember, BackendMedication, BackendRecord, BackendSchedule } from './types';

export function toMember(b: BackendMember): Member {
  return {
    id: b.id,
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
    id: b.id,
    memberId: b.memberId,
    userId: b.userId,
    name: b.name,
    category: (b.category as MedicationCategory) || 'regular',
    dosage: b.dosageAmount,
    frequency: b.frequency,
    stockQuantity: b.stockQuantity,
    stockAlertDate: b.stockAlertDate ? new Date(b.stockAlertDate) : undefined,
    instructions: b.instructions,
    isActive: b.isActive ?? true,
    createdAt: new Date(b.createdAt),
    updatedAt: new Date(b.updatedAt),
  };
}

export function toMedicationRecord(b: BackendRecord): MedicationRecord {
  return {
    id: b.id,
    memberId: b.memberId,
    memberName: b.memberName || '',
    medicationId: b.medicationId,
    medicationName: b.medicationName || '',
    userId: b.userId,
    scheduleId: b.scheduleId,
    takenAt: new Date(b.takenAt),
    notes: b.notes,
    dosageAmount: b.dosageAmount,
  };
}

export function toSchedule(b: BackendSchedule): Schedule {
  return {
    id: b.id,
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
