/**
 * 依存性注入コンテナ
 * Domain層のリポジトリインターフェースにData層の実装を紐づける
 */

import { MemberRepository } from '../domain/repositories/MemberRepository';
import { MedicationRepository } from '../domain/repositories/MedicationRepository';
import { ScheduleRepository } from '../domain/repositories/ScheduleRepository';
import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { HospitalRepository } from '../domain/repositories/HospitalRepository';
import { MedicationRecordRepository } from '../domain/repositories/MedicationRecordRepository';
import { UserProfileRepository } from '../domain/repositories/UserProfileRepository';
import { HealthLogRepository } from '../domain/repositories/HealthLogRepository';
import { VaccinationRepository } from '../domain/repositories/VaccinationRepository';
import { ExaminationRepository } from '../domain/repositories/ExaminationRepository';
import { InsuranceRepository } from '../domain/repositories/InsuranceRepository';
import { AllergyRepository } from '../domain/repositories/AllergyRepository';
import { BodyMeasurementRepository } from '../domain/repositories/BodyMeasurementRepository';
import { EmergencyContactRepository } from '../domain/repositories/EmergencyContactRepository';
import { MemberRepositoryImpl } from '../data/repositories/MemberRepositoryImpl';
import { MedicationRepositoryImpl } from '../data/repositories/MedicationRepositoryImpl';
import { ScheduleRepositoryImpl } from '../data/repositories/ScheduleRepositoryImpl';
import { AppointmentRepositoryImpl } from '../data/repositories/AppointmentRepositoryImpl';
import { HospitalRepositoryImpl } from '../data/repositories/HospitalRepositoryImpl';
import { MedicationRecordRepositoryImpl } from '../data/repositories/MedicationRecordRepositoryImpl';
import { UserProfileRepositoryImpl } from '../data/repositories/UserProfileRepositoryImpl';
import { HealthLogRepositoryImpl } from '../data/repositories/HealthLogRepositoryImpl';
import { VaccinationRepositoryImpl } from '../data/repositories/VaccinationRepositoryImpl';
import { ExaminationRepositoryImpl } from '../data/repositories/ExaminationRepositoryImpl';
import { InsuranceRepositoryImpl } from '../data/repositories/InsuranceRepositoryImpl';
import { AllergyRepositoryImpl } from '../data/repositories/AllergyRepositoryImpl';
import { BodyMeasurementRepositoryImpl } from '../data/repositories/BodyMeasurementRepositoryImpl';
import { EmergencyContactRepositoryImpl } from '../data/repositories/EmergencyContactRepositoryImpl';

export interface DIContainer {
  memberRepository: MemberRepository;
  medicationRepository: MedicationRepository;
  scheduleRepository: ScheduleRepository;
  appointmentRepository: AppointmentRepository;
  hospitalRepository: HospitalRepository;
  medicationRecordRepository: MedicationRecordRepository;
  userProfileRepository: UserProfileRepository;
  healthLogRepository: HealthLogRepository;
  vaccinationRepository: VaccinationRepository;
  examinationRepository: ExaminationRepository;
  insuranceRepository: InsuranceRepository;
  allergyRepository: AllergyRepository;
  bodyMeasurementRepository: BodyMeasurementRepository;
  emergencyContactRepository: EmergencyContactRepository;
}

// シングルトンコンテナ（テスト時にモックに差し替え可能）
let container: DIContainer | null = null;

export const getDIContainer = (): DIContainer => {
  if (!container) {
    container = {
      memberRepository: new MemberRepositoryImpl(),
      medicationRepository: new MedicationRepositoryImpl(),
      scheduleRepository: new ScheduleRepositoryImpl(),
      appointmentRepository: new AppointmentRepositoryImpl(),
      hospitalRepository: new HospitalRepositoryImpl(),
      medicationRecordRepository: new MedicationRecordRepositoryImpl(),
      userProfileRepository: new UserProfileRepositoryImpl(),
      healthLogRepository: new HealthLogRepositoryImpl(),
      vaccinationRepository: new VaccinationRepositoryImpl(),
      examinationRepository: new ExaminationRepositoryImpl(),
      insuranceRepository: new InsuranceRepositoryImpl(),
      allergyRepository: new AllergyRepositoryImpl(),
      bodyMeasurementRepository: new BodyMeasurementRepositoryImpl(),
      emergencyContactRepository: new EmergencyContactRepositoryImpl(),
    };
  }
  return container;
};

// テスト用: DIコンテナを差し替え
export const setDIContainer = (newContainer: DIContainer): void => {
  container = newContainer;
};

// テスト用: DIコンテナをリセット
export const resetDIContainer = (): void => {
  container = null;
};
