import { Appointment } from '../../domain/entities/Appointment';
import { Hospital } from '../../domain/entities/Hospital';
import { Member, MemberType, PetType } from '../../domain/entities/Member';
import { Medication, MedicationCategory } from '../../domain/entities/Medication';
import { MedicationRecord } from '../../domain/entities/MedicationRecord';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { BackendAppointment, BackendHospital, BackendMember, BackendMedication, BackendRecord, BackendSchedule } from './types';

const VALID_MEMBER_TYPES: readonly string[] = ['human', 'pet'];
const VALID_MEDICATION_CATEGORIES: readonly string[] = ['regular', 'supplement', 'prn', 'inhaler', 'flea_tick', 'heartworm'];
const VALID_DAYS_OF_WEEK: readonly string[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const VALID_PET_TYPES: readonly string[] = ['dog', 'cat', 'rabbit', 'bird', 'other'];

export function toMember(b: BackendMember): Member {
  return {
    id: b.id,
    userId: b.userId,
    memberType: b.memberType && VALID_MEMBER_TYPES.includes(b.memberType) ? (b.memberType as MemberType) : 'human',
    name: b.name,
    petType: b.petType && VALID_PET_TYPES.includes(b.petType) ? (b.petType as PetType) : undefined,
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
    category: b.category && VALID_MEDICATION_CATEGORIES.includes(b.category) ? (b.category as MedicationCategory) : 'regular',
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

export function toHospital(b: BackendHospital): Hospital {
  return {
    id: b.id,
    userId: b.userId,
    name: b.name,
    hospitalType: b.hospitalType,
    address: b.address,
    phoneNumber: b.phoneNumber,
    notes: b.notes,
    createdAt: new Date(b.createdAt),
  };
}

export function toAppointment(b: BackendAppointment): Appointment {
  return {
    id: b.id,
    userId: b.userId,
    memberId: b.memberId,
    memberName: b.memberName,
    hospitalId: b.hospitalId,
    hospitalName: b.hospitalName,
    appointmentType: b.appointmentType,
    appointmentDate: new Date(b.appointmentDate),
    description: b.description,
    reminderEnabled: b.reminderEnabled ?? true,
    reminderDaysBefore: b.reminderDaysBefore ?? 1,
    createdAt: new Date(b.createdAt),
  };
}

export function toSchedule(b: BackendSchedule): Schedule {
  return {
    id: b.id,
    medicationId: b.medicationId,
    userId: b.userId,
    memberId: b.memberId,
    scheduledTime: b.scheduledTime,
    daysOfWeek: (b.daysOfWeek?.filter((d: string) => VALID_DAYS_OF_WEEK.includes(d)) as DayOfWeek[]) ?? [],
    isEnabled: b.isEnabled ?? true,
    reminderMinutesBefore: b.reminderMinutesBefore ?? 10,
    createdAt: new Date(b.createdAt),
  };
}
