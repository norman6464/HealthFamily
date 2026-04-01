import { Appointment } from '../../domain/entities/Appointment';
import { Hospital } from '../../domain/entities/Hospital';
import { Member, MemberType, PetType } from '../../domain/entities/Member';
import { Medication, MedicationCategory } from '../../domain/entities/Medication';
import { MedicationRecord } from '../../domain/entities/MedicationRecord';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { HealthLog, ConditionLevel, SymptomType, SYMPTOM_OPTIONS } from '../../domain/entities/HealthLog';
import { Vaccination } from '../../domain/entities/Vaccination';
import { Examination } from '../../domain/entities/Examination';
import { Allergy } from '../../domain/entities/Allergy';
import { BodyMeasurement } from '../../domain/entities/BodyMeasurement';
import { EmergencyContact } from '../../domain/entities/EmergencyContact';
import { Prescription } from '../../domain/entities/Prescription';
import { Insurance } from '../../domain/entities/Insurance';
import { BackendAllergy, BackendBodyMeasurement, BackendEmergencyContact, BackendPrescription, BackendAppointment, BackendExamination, BackendHealthLog, BackendHospital, BackendInsurance, BackendMember, BackendMedication, BackendRecord, BackendSchedule, BackendVaccination } from './types';

const VALID_SYMPTOMS: readonly string[] = [...SYMPTOM_OPTIONS];

const VALID_MEMBER_TYPES: readonly string[] = ['human', 'pet'];
const VALID_MEDICATION_CATEGORIES: readonly string[] = ['regular', 'supplement', 'prn', 'inhaler', 'eye_drops', 'patch', 'topical', 'flea_tick', 'heartworm'];
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
    displayOrder: b.displayOrder ?? 0,
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
    department: b.department,
    doctorName: b.doctorName,
    notes: b.notes,
    createdAt: new Date(b.createdAt),
  };
}

export function toAppointment(b: BackendAppointment): Appointment {
  const parsedDate = new Date(b.appointmentDate);
  return {
    id: b.id,
    userId: b.userId,
    memberId: b.memberId,
    memberName: b.memberName,
    hospitalId: b.hospitalId,
    hospitalName: b.hospitalName,
    appointmentType: b.appointmentType,
    appointmentDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
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
    intervalDays: b.intervalDays ?? undefined,
    startDate: b.startDate ? new Date(b.startDate) : undefined,
    isEnabled: b.isEnabled ?? true,
    reminderMinutesBefore: b.reminderMinutesBefore ?? 10,
    createdAt: new Date(b.createdAt),
  };
}

export function toVaccination(b: BackendVaccination): Vaccination {
  return {
    id: b.id,
    userId: b.userId,
    memberId: b.memberId,
    memberName: b.memberName,
    vaccineName: b.vaccineName,
    vaccinatedAt: new Date(b.vaccinatedAt),
    nextScheduledDate: b.nextScheduledDate ? new Date(b.nextScheduledDate) : undefined,
    notes: b.notes,
    createdAt: new Date(b.createdAt),
  };
}

export function toInsurance(b: BackendInsurance): Insurance {
  return {
    id: b.id,
    userId: b.userId,
    memberId: b.memberId,
    memberName: b.memberName,
    insuranceType: b.insuranceType,
    providerName: b.providerName,
    policyNumber: b.policyNumber,
    notes: b.notes,
    createdAt: new Date(b.createdAt),
  };
}

export function toPrescription(b: BackendPrescription): Prescription {
  return {
    id: b.id,
    userId: b.userId,
    memberId: b.memberId,
    memberName: b.memberName,
    prescriptionName: b.prescriptionName,
    prescribedBy: b.prescribedBy,
    prescribedAt: new Date(b.prescribedAt),
    expiresAt: b.expiresAt ? new Date(b.expiresAt) : undefined,
    pharmacyName: b.pharmacyName,
    notes: b.notes,
    createdAt: new Date(b.createdAt),
  };
}

export function toEmergencyContact(b: BackendEmergencyContact): EmergencyContact {
  return {
    id: b.id,
    userId: b.userId,
    memberId: b.memberId,
    memberName: b.memberName,
    contactName: b.contactName,
    phoneNumber: b.phoneNumber,
    relationship: b.relationship,
    notes: b.notes,
    createdAt: new Date(b.createdAt),
  };
}

export function toBodyMeasurement(b: BackendBodyMeasurement): BodyMeasurement {
  return {
    id: b.id,
    userId: b.userId,
    memberId: b.memberId,
    memberName: b.memberName,
    weight: b.weight,
    height: b.height,
    recordedAt: new Date(b.recordedAt),
    notes: b.notes,
    createdAt: new Date(b.createdAt),
  };
}

export function toAllergy(b: BackendAllergy): Allergy {
  return {
    id: b.id,
    userId: b.userId,
    memberId: b.memberId,
    memberName: b.memberName,
    allergenName: b.allergenName,
    allergyType: b.allergyType,
    severity: b.severity,
    symptoms: b.symptoms,
    diagnosedAt: b.diagnosedAt ? new Date(b.diagnosedAt) : undefined,
    notes: b.notes,
    createdAt: new Date(b.createdAt),
  };
}

export function toExamination(b: BackendExamination): Examination {
  return {
    id: b.id,
    userId: b.userId,
    memberId: b.memberId,
    memberName: b.memberName,
    examinationType: b.examinationType,
    examinedAt: new Date(b.examinedAt),
    nextScheduledDate: b.nextScheduledDate ? new Date(b.nextScheduledDate) : undefined,
    notes: b.notes,
    createdAt: new Date(b.createdAt),
  };
}

export function toHealthLog(b: BackendHealthLog): HealthLog {
  const validLevel = b.conditionLevel >= 1 && b.conditionLevel <= 5 ? (b.conditionLevel as ConditionLevel) : (3 as ConditionLevel);
  return {
    id: b.id,
    memberId: b.memberId,
    memberName: b.memberName || '',
    userId: b.userId,
    conditionLevel: validLevel,
    symptoms: (b.symptoms?.filter((s: string) => VALID_SYMPTOMS.includes(s)) as SymptomType[]) ?? [],
    notes: b.notes,
    recordedAt: new Date(b.recordedAt),
  };
}
