/**
 * サーバーサイド用DIコンテナ
 * APIルートからUsecase経由でPrismaリポジトリを使用するためのファクトリ
 * フロントエンド用のDIContainer（API経由）とは別に、サーバーサイドではPrisma直接アクセスを行う
 */

import { MedicationRepository } from '@/domain/repositories/MedicationRepository';
import { ScheduleRepository } from '@/domain/repositories/ScheduleRepository';
import { MedicationRecordRepository } from '@/domain/repositories/MedicationRecordRepository';
import { HospitalRepository } from '@/domain/repositories/HospitalRepository';
import { ExaminationRepository } from '@/domain/repositories/ExaminationRepository';
import { VaccinationRepository } from '@/domain/repositories/VaccinationRepository';
import { InsuranceRepository } from '@/domain/repositories/InsuranceRepository';
import { BodyMeasurementRepository } from '@/domain/repositories/BodyMeasurementRepository';
import { EmergencyContactRepository } from '@/domain/repositories/EmergencyContactRepository';
import { PrescriptionRepository } from '@/domain/repositories/PrescriptionRepository';
import { AllergyRepository } from '@/domain/repositories/AllergyRepository';
import { HealthLogRepository } from '@/domain/repositories/HealthLogRepository';
import { MemberRepository } from '@/domain/repositories/MemberRepository';
import { AppointmentRepository } from '@/domain/repositories/AppointmentRepository';
import { UserProfileRepository } from '@/domain/repositories/UserProfileRepository';
import { PrismaMedicationRepository } from '@/data/repositories/server/PrismaMedicationRepository';
import { PrismaScheduleRepository } from '@/data/repositories/server/PrismaScheduleRepository';
import { PrismaMedicationRecordRepository } from '@/data/repositories/server/PrismaMedicationRecordRepository';
import { PrismaHospitalRepository } from '@/data/repositories/server/PrismaHospitalRepository';
import { PrismaExaminationRepository } from '@/data/repositories/server/PrismaExaminationRepository';
import { PrismaVaccinationRepository } from '@/data/repositories/server/PrismaVaccinationRepository';
import { PrismaInsuranceRepository } from '@/data/repositories/server/PrismaInsuranceRepository';
import { PrismaBodyMeasurementRepository } from '@/data/repositories/server/PrismaBodyMeasurementRepository';
import { PrismaEmergencyContactRepository } from '@/data/repositories/server/PrismaEmergencyContactRepository';
import { PrismaPrescriptionRepository } from '@/data/repositories/server/PrismaPrescriptionRepository';
import { PrismaAllergyRepository } from '@/data/repositories/server/PrismaAllergyRepository';
import { PrismaHealthLogRepository } from '@/data/repositories/server/PrismaHealthLogRepository';
import { PrismaMemberRepository } from '@/data/repositories/server/PrismaMemberRepository';
import { PrismaAppointmentRepository } from '@/data/repositories/server/PrismaAppointmentRepository';
import { PrismaUserProfileRepository } from '@/data/repositories/server/PrismaUserProfileRepository';

export interface ServerDIContainer {
  medicationRepository: MedicationRepository;
  scheduleRepository: ScheduleRepository;
  medicationRecordRepository: MedicationRecordRepository;
  hospitalRepository: HospitalRepository;
  examinationRepository: ExaminationRepository;
  vaccinationRepository: VaccinationRepository;
  insuranceRepository: InsuranceRepository;
  bodyMeasurementRepository: BodyMeasurementRepository;
  emergencyContactRepository: EmergencyContactRepository;
  prescriptionRepository: PrescriptionRepository;
  allergyRepository: AllergyRepository;
  healthLogRepository: HealthLogRepository;
  memberRepository: MemberRepository;
  appointmentRepository: AppointmentRepository;
  userProfileRepository: UserProfileRepository;
}

/**
 * ユーザーIDに紐づくサーバーサイドDIコンテナを生成する
 * APIルートのリクエストごとに新規作成される（ユーザーごとのスコープ）
 */
export function createServerDIContainer(userId: string): ServerDIContainer {
  return {
    medicationRepository: new PrismaMedicationRepository(userId),
    scheduleRepository: new PrismaScheduleRepository(userId),
    medicationRecordRepository: new PrismaMedicationRecordRepository(userId),
    hospitalRepository: new PrismaHospitalRepository(userId),
    examinationRepository: new PrismaExaminationRepository(userId),
    vaccinationRepository: new PrismaVaccinationRepository(userId),
    insuranceRepository: new PrismaInsuranceRepository(userId),
    bodyMeasurementRepository: new PrismaBodyMeasurementRepository(userId),
    emergencyContactRepository: new PrismaEmergencyContactRepository(userId),
    prescriptionRepository: new PrismaPrescriptionRepository(userId),
    allergyRepository: new PrismaAllergyRepository(userId),
    healthLogRepository: new PrismaHealthLogRepository(userId),
    memberRepository: new PrismaMemberRepository(userId),
    appointmentRepository: new PrismaAppointmentRepository(userId),
    userProfileRepository: new PrismaUserProfileRepository(userId),
  };
}
