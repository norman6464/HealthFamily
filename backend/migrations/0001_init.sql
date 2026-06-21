-- HealthFamily 初期スキーマ (生SQL / PostgreSQL)
-- Prisma schema.prisma と完全に一致するテーブル構成。
-- テーブル名は PascalCase、カラム名は camelCase でダブルクォート必須（Prisma が大文字小文字を保持して作成しているため）。
-- ID は TEXT(cuid, アプリ生成), 配列は TEXT[]。
-- 既存DB(Supabase)に対して安全に no-op となるよう CREATE TABLE IF NOT EXISTS を使用する。

CREATE TABLE IF NOT EXISTS "User" (
    "id"                   TEXT PRIMARY KEY,
    "email"                TEXT NOT NULL UNIQUE,
    "password"             TEXT NOT NULL,
    "displayName"          TEXT,
    "characterType"        TEXT NOT NULL DEFAULT 'cat',
    "characterName"        TEXT,
    "emailVerified"        BOOLEAN NOT NULL DEFAULT FALSE,
    "verificationCode"     TEXT,
    "verificationExpiry"   TIMESTAMPTZ,
    "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "resetCode"            TEXT,
    "resetCodeExpiry"      TIMESTAMPTZ,
    "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Member" (
    "id"         TEXT PRIMARY KEY,
    "userId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberType" TEXT NOT NULL DEFAULT 'human',
    "name"       TEXT NOT NULL,
    "petType"    TEXT,
    "photoUrl"   TEXT,
    "birthDate"  TIMESTAMPTZ,
    "notes"      TEXT,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Member_userId_idx" ON "Member"("userId");

CREATE TABLE IF NOT EXISTS "Medication" (
    "id"             TEXT PRIMARY KEY,
    "memberId"       TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "userId"         TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "category"       TEXT NOT NULL DEFAULT 'regular',
    "dosageAmount"   TEXT,
    "frequency"      TEXT,
    "stockQuantity"  INTEGER,
    "stockAlertDate" TIMESTAMPTZ,
    "intervalHours"  INTEGER,
    "instructions"   TEXT,
    "displayOrder"   INTEGER NOT NULL DEFAULT 0,
    "isActive"       BOOLEAN NOT NULL DEFAULT TRUE,
    "status"         TEXT NOT NULL DEFAULT 'active',
    "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Medication_memberId_idx" ON "Medication"("memberId");
CREATE INDEX IF NOT EXISTS "Medication_userId_idx" ON "Medication"("userId");

CREATE TABLE IF NOT EXISTS "Schedule" (
    "id"                    TEXT PRIMARY KEY,
    "medicationId"          TEXT NOT NULL REFERENCES "Medication"("id") ON DELETE CASCADE,
    "userId"                TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"              TEXT NOT NULL,
    "scheduledTime"         TEXT NOT NULL,
    "daysOfWeek"            TEXT[] NOT NULL DEFAULT '{}',
    "intervalDays"          INTEGER,
    "startDate"             TIMESTAMPTZ,
    "isEnabled"             BOOLEAN NOT NULL DEFAULT TRUE,
    "reminderMinutesBefore" INTEGER NOT NULL DEFAULT 5,
    "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Schedule_userId_idx" ON "Schedule"("userId");
CREATE INDEX IF NOT EXISTS "Schedule_medicationId_idx" ON "Schedule"("medicationId");

CREATE TABLE IF NOT EXISTS "MedicationRecord" (
    "id"           TEXT PRIMARY KEY,
    "memberId"     TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "medicationId" TEXT NOT NULL REFERENCES "Medication"("id") ON DELETE CASCADE,
    "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "scheduleId"   TEXT,
    "takenAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
    "notes"        TEXT,
    "dosageAmount" TEXT
);
CREATE INDEX IF NOT EXISTS "MedicationRecord_userId_idx" ON "MedicationRecord"("userId");
CREATE INDEX IF NOT EXISTS "MedicationRecord_memberId_idx" ON "MedicationRecord"("memberId");

CREATE TABLE IF NOT EXISTS "Hospital" (
    "id"           TEXT PRIMARY KEY,
    "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "name"         TEXT NOT NULL,
    "hospitalType" TEXT,
    "address"      TEXT,
    "phoneNumber"  TEXT,
    "department"   TEXT,
    "doctorName"   TEXT,
    "notes"        TEXT,
    "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Hospital_userId_idx" ON "Hospital"("userId");

CREATE TABLE IF NOT EXISTS "HealthLog" (
    "id"             TEXT PRIMARY KEY,
    "memberId"       TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "userId"         TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "conditionLevel" INTEGER NOT NULL,
    "symptoms"       TEXT[] NOT NULL DEFAULT '{}',
    "notes"          TEXT,
    "recordedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "HealthLog_userId_idx" ON "HealthLog"("userId");
CREATE INDEX IF NOT EXISTS "HealthLog_memberId_idx" ON "HealthLog"("memberId");

CREATE TABLE IF NOT EXISTS "Appointment" (
    "id"                 TEXT PRIMARY KEY,
    "userId"             TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"           TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "hospitalId"         TEXT REFERENCES "Hospital"("id"),
    "appointmentType"    TEXT,
    "appointmentDate"    TIMESTAMPTZ NOT NULL,
    "description"        TEXT,
    "testResults"        TEXT,
    "cost"               DOUBLE PRECISION,
    "reminderEnabled"    BOOLEAN NOT NULL DEFAULT TRUE,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Appointment_userId_idx" ON "Appointment"("userId");
CREATE INDEX IF NOT EXISTS "Appointment_memberId_idx" ON "Appointment"("memberId");

CREATE TABLE IF NOT EXISTS "Vaccination" (
    "id"                TEXT PRIMARY KEY,
    "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"          TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "vaccineName"       TEXT NOT NULL,
    "vaccinatedAt"      TIMESTAMPTZ NOT NULL,
    "nextScheduledDate" TIMESTAMPTZ,
    "notes"             TEXT,
    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Vaccination_userId_idx" ON "Vaccination"("userId");
CREATE INDEX IF NOT EXISTS "Vaccination_memberId_idx" ON "Vaccination"("memberId");

CREATE TABLE IF NOT EXISTS "Examination" (
    "id"                TEXT PRIMARY KEY,
    "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"          TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "examinationType"   TEXT NOT NULL,
    "examinedAt"        TIMESTAMPTZ NOT NULL,
    "nextScheduledDate" TIMESTAMPTZ,
    "notes"             TEXT,
    "imageData"         TEXT,
    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Examination_userId_idx" ON "Examination"("userId");
CREATE INDEX IF NOT EXISTS "Examination_memberId_idx" ON "Examination"("memberId");

CREATE TABLE IF NOT EXISTS "Insurance" (
    "id"            TEXT PRIMARY KEY,
    "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"      TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "insuranceType" TEXT NOT NULL,
    "providerName"  TEXT,
    "policyNumber"  TEXT,
    "notes"         TEXT,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Insurance_userId_idx" ON "Insurance"("userId");
CREATE INDEX IF NOT EXISTS "Insurance_memberId_idx" ON "Insurance"("memberId");

CREATE TABLE IF NOT EXISTS "Allergy" (
    "id"           TEXT PRIMARY KEY,
    "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"     TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "allergenName" TEXT NOT NULL,
    "allergyType"  TEXT NOT NULL,
    "severity"     TEXT NOT NULL,
    "symptoms"     TEXT,
    "diagnosedAt"  TIMESTAMPTZ,
    "notes"        TEXT,
    "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Allergy_userId_idx" ON "Allergy"("userId");
CREATE INDEX IF NOT EXISTS "Allergy_memberId_idx" ON "Allergy"("memberId");

CREATE TABLE IF NOT EXISTS "BodyMeasurement" (
    "id"         TEXT PRIMARY KEY,
    "userId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"   TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "weight"     DOUBLE PRECISION,
    "height"     DOUBLE PRECISION,
    "recordedAt" TIMESTAMPTZ NOT NULL,
    "notes"      TEXT,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "BodyMeasurement_userId_idx" ON "BodyMeasurement"("userId");
CREATE INDEX IF NOT EXISTS "BodyMeasurement_memberId_idx" ON "BodyMeasurement"("memberId");

CREATE TABLE IF NOT EXISTS "TemperatureRecord" (
    "id"          TEXT PRIMARY KEY,
    "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"    TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "temperature" DOUBLE PRECISION NOT NULL,
    "measuredAt"  TIMESTAMPTZ NOT NULL,
    "notes"       TEXT,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TemperatureRecord_userId_idx" ON "TemperatureRecord"("userId");
CREATE INDEX IF NOT EXISTS "TemperatureRecord_memberId_idx" ON "TemperatureRecord"("memberId");
CREATE INDEX IF NOT EXISTS "TemperatureRecord_memberId_measuredAt_idx" ON "TemperatureRecord"("memberId", "measuredAt");

CREATE TABLE IF NOT EXISTS "EmergencyContact" (
    "id"           TEXT PRIMARY KEY,
    "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"     TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "contactName"  TEXT NOT NULL,
    "phoneNumber"  TEXT NOT NULL,
    "relationship" TEXT,
    "notes"        TEXT,
    "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");
CREATE INDEX IF NOT EXISTS "EmergencyContact_memberId_idx" ON "EmergencyContact"("memberId");

CREATE TABLE IF NOT EXISTS "Prescription" (
    "id"               TEXT PRIMARY KEY,
    "userId"           TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"         TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
    "prescriptionName" TEXT NOT NULL,
    "prescribedBy"     TEXT,
    "prescribedAt"     TIMESTAMPTZ NOT NULL,
    "expiresAt"        TIMESTAMPTZ,
    "pharmacyName"     TEXT,
    "notes"            TEXT,
    "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Prescription_userId_idx" ON "Prescription"("userId");
CREATE INDEX IF NOT EXISTS "Prescription_memberId_idx" ON "Prescription"("memberId");

CREATE TABLE IF NOT EXISTS "NotificationSetting" (
    "id"                                   TEXT PRIMARY KEY,
    "userId"                               TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "medicationReminderEnabled"            BOOLEAN NOT NULL DEFAULT TRUE,
    "missedMedicationEnabled"              BOOLEAN NOT NULL DEFAULT TRUE,
    "appointmentReminderEnabled"           BOOLEAN NOT NULL DEFAULT TRUE,
    "lowStockAlertEnabled"                 BOOLEAN NOT NULL DEFAULT TRUE,
    "defaultReminderMinutesBefore"         INTEGER NOT NULL DEFAULT 5,
    "defaultAppointmentReminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "emailNotificationEnabled"             BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"                            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"                            TIMESTAMPTZ NOT NULL DEFAULT now()
);
