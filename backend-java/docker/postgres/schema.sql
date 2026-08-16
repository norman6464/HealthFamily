CREATE TABLE public."Allergy" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    "allergenName" text NOT NULL,
    "allergyType" text NOT NULL,
    severity text NOT NULL,
    symptoms text,
    "diagnosedAt" timestamp with time zone,
    notes text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."Appointment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    "hospitalId" text,
    "appointmentType" text,
    "appointmentDate" timestamp with time zone NOT NULL,
    description text,
    "testResults" text,
    cost double precision,
    "reminderEnabled" boolean DEFAULT true NOT NULL,
    "reminderDaysBefore" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."BodyMeasurement" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    weight double precision,
    height double precision,
    "recordedAt" timestamp with time zone NOT NULL,
    notes text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."Budget" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "monthlyAmount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "alertEnabled" boolean DEFAULT true NOT NULL,
    "lastAlertedMonth" text
);
CREATE TABLE public."CategoryBudget" (
    id text NOT NULL,
    "userId" text NOT NULL,
    category text NOT NULL,
    "monthlyAmount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."DashboardPreference" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "hiddenCards" text[] DEFAULT '{}'::text[] NOT NULL,
    "cardOrder" text[] DEFAULT '{}'::text[] NOT NULL,
    "defaultMemberId" text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."EmergencyContact" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    "contactName" text NOT NULL,
    "phoneNumber" text NOT NULL,
    relationship text,
    notes text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."Examination" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    "examinationType" text NOT NULL,
    "examinedAt" timestamp with time zone NOT NULL,
    "nextScheduledDate" timestamp with time zone,
    notes text,
    "imageData" text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."Expense" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text,
    category text NOT NULL,
    amount integer NOT NULL,
    description text,
    "expenseDate" timestamp with time zone NOT NULL,
    "isDeductible" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."HealthLog" (
    id text NOT NULL,
    "memberId" text NOT NULL,
    "userId" text NOT NULL,
    "conditionLevel" integer NOT NULL,
    symptoms text[] DEFAULT '{}'::text[] NOT NULL,
    notes text,
    "recordedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."Hospital" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    "hospitalType" text,
    address text,
    "phoneNumber" text,
    department text,
    "doctorName" text,
    notes text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."Insurance" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    "insuranceType" text NOT NULL,
    "providerName" text,
    "policyNumber" text,
    notes text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."Medication" (
    id text NOT NULL,
    "memberId" text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'regular'::text NOT NULL,
    "dosageAmount" text,
    frequency text,
    "stockQuantity" integer,
    "stockAlertDate" timestamp with time zone,
    "intervalHours" integer,
    instructions text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."MedicationRecord" (
    id text NOT NULL,
    "memberId" text NOT NULL,
    "medicationId" text NOT NULL,
    "userId" text NOT NULL,
    "scheduleId" text,
    "takenAt" timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    "dosageAmount" text
);
CREATE TABLE public."Member" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberType" text DEFAULT 'human'::text NOT NULL,
    name text NOT NULL,
    "petType" text,
    "photoUrl" text,
    "birthDate" timestamp with time zone,
    notes text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."NotificationSetting" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "medicationReminderEnabled" boolean DEFAULT true NOT NULL,
    "missedMedicationEnabled" boolean DEFAULT true NOT NULL,
    "appointmentReminderEnabled" boolean DEFAULT true NOT NULL,
    "lowStockAlertEnabled" boolean DEFAULT true NOT NULL,
    "defaultReminderMinutesBefore" integer DEFAULT 5 NOT NULL,
    "defaultAppointmentReminderDaysBefore" integer DEFAULT 1 NOT NULL,
    "emailNotificationEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."Prescription" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    "prescriptionName" text NOT NULL,
    "prescribedBy" text,
    "prescribedAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone,
    "pharmacyName" text,
    notes text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "electronicCode" text
);
CREATE TABLE public."PrescriptionItem" (
    id text NOT NULL,
    "prescriptionId" text NOT NULL,
    name text NOT NULL,
    dosage text,
    frequency text,
    days integer,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."Schedule" (
    id text NOT NULL,
    "medicationId" text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    "scheduledTime" text NOT NULL,
    "daysOfWeek" text[] DEFAULT '{}'::text[] NOT NULL,
    "intervalDays" integer,
    "startDate" timestamp with time zone,
    "isEnabled" boolean DEFAULT true NOT NULL,
    "reminderMinutesBefore" integer DEFAULT 5 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."TemperatureRecord" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    temperature double precision NOT NULL,
    "measuredAt" timestamp with time zone NOT NULL,
    notes text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "displayName" text,
    "characterType" text DEFAULT 'cat'::text NOT NULL,
    "characterName" text,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "verificationCode" text,
    "verificationExpiry" timestamp with time zone,
    "verificationAttempts" integer DEFAULT 0 NOT NULL,
    "resetCode" text,
    "resetCodeExpiry" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "googleId" text
);
CREATE TABLE public."Vaccination" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "memberId" text NOT NULL,
    "vaccineName" text NOT NULL,
    "vaccinatedAt" timestamp with time zone NOT NULL,
    "nextScheduledDate" timestamp with time zone,
    notes text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public."Allergy"
    ADD CONSTRAINT "Allergy_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."BodyMeasurement"
    ADD CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_userId_key" UNIQUE ("userId");
ALTER TABLE ONLY public."CategoryBudget"
    ADD CONSTRAINT "CategoryBudget_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."CategoryBudget"
    ADD CONSTRAINT "CategoryBudget_userId_category_key" UNIQUE ("userId", category);
ALTER TABLE ONLY public."DashboardPreference"
    ADD CONSTRAINT "DashboardPreference_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."DashboardPreference"
    ADD CONSTRAINT "DashboardPreference_userId_key" UNIQUE ("userId");
ALTER TABLE ONLY public."EmergencyContact"
    ADD CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Examination"
    ADD CONSTRAINT "Examination_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."HealthLog"
    ADD CONSTRAINT "HealthLog_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Hospital"
    ADD CONSTRAINT "Hospital_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Insurance"
    ADD CONSTRAINT "Insurance_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."MedicationRecord"
    ADD CONSTRAINT "MedicationRecord_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Medication"
    ADD CONSTRAINT "Medication_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."NotificationSetting"
    ADD CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."NotificationSetting"
    ADD CONSTRAINT "NotificationSetting_userId_key" UNIQUE ("userId");
ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."TemperatureRecord"
    ADD CONSTRAINT "TemperatureRecord_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);
ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Vaccination"
    ADD CONSTRAINT "Vaccination_pkey" PRIMARY KEY (id);
CREATE INDEX "Allergy_memberId_idx" ON public."Allergy" USING btree ("memberId");
CREATE INDEX "Allergy_userId_idx" ON public."Allergy" USING btree ("userId");
CREATE INDEX "Appointment_memberId_idx" ON public."Appointment" USING btree ("memberId");
CREATE INDEX "Appointment_userId_idx" ON public."Appointment" USING btree ("userId");
CREATE INDEX "BodyMeasurement_memberId_idx" ON public."BodyMeasurement" USING btree ("memberId");
CREATE INDEX "BodyMeasurement_userId_idx" ON public."BodyMeasurement" USING btree ("userId");
CREATE INDEX "CategoryBudget_userId_idx" ON public."CategoryBudget" USING btree ("userId");
CREATE INDEX "EmergencyContact_memberId_idx" ON public."EmergencyContact" USING btree ("memberId");
CREATE INDEX "EmergencyContact_userId_idx" ON public."EmergencyContact" USING btree ("userId");
CREATE INDEX "Examination_memberId_idx" ON public."Examination" USING btree ("memberId");
CREATE INDEX "Examination_userId_idx" ON public."Examination" USING btree ("userId");
CREATE INDEX "Expense_memberId_idx" ON public."Expense" USING btree ("memberId");
CREATE INDEX "Expense_userId_expenseDate_idx" ON public."Expense" USING btree ("userId", "expenseDate");
CREATE INDEX "Expense_userId_idx" ON public."Expense" USING btree ("userId");
CREATE INDEX "HealthLog_memberId_idx" ON public."HealthLog" USING btree ("memberId");
CREATE INDEX "HealthLog_userId_idx" ON public."HealthLog" USING btree ("userId");
CREATE INDEX "Hospital_userId_idx" ON public."Hospital" USING btree ("userId");
CREATE INDEX "Insurance_memberId_idx" ON public."Insurance" USING btree ("memberId");
CREATE INDEX "Insurance_userId_idx" ON public."Insurance" USING btree ("userId");
CREATE INDEX "MedicationRecord_memberId_idx" ON public."MedicationRecord" USING btree ("memberId");
CREATE INDEX "MedicationRecord_userId_idx" ON public."MedicationRecord" USING btree ("userId");
CREATE INDEX "Medication_memberId_idx" ON public."Medication" USING btree ("memberId");
CREATE INDEX "Medication_userId_idx" ON public."Medication" USING btree ("userId");
CREATE INDEX "Member_userId_idx" ON public."Member" USING btree ("userId");
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON public."PrescriptionItem" USING btree ("prescriptionId");
CREATE INDEX "Prescription_memberId_idx" ON public."Prescription" USING btree ("memberId");
CREATE INDEX "Prescription_userId_idx" ON public."Prescription" USING btree ("userId");
CREATE INDEX "Schedule_medicationId_idx" ON public."Schedule" USING btree ("medicationId");
CREATE INDEX "Schedule_userId_idx" ON public."Schedule" USING btree ("userId");
CREATE INDEX "TemperatureRecord_memberId_idx" ON public."TemperatureRecord" USING btree ("memberId");
CREATE INDEX "TemperatureRecord_memberId_measuredAt_idx" ON public."TemperatureRecord" USING btree ("memberId", "measuredAt");
CREATE INDEX "TemperatureRecord_userId_idx" ON public."TemperatureRecord" USING btree ("userId");
CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");
CREATE INDEX "Vaccination_memberId_idx" ON public."Vaccination" USING btree ("memberId");
CREATE INDEX "Vaccination_userId_idx" ON public."Vaccination" USING btree ("userId");
ALTER TABLE ONLY public."Allergy"
    ADD CONSTRAINT "Allergy_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Allergy"
    ADD CONSTRAINT "Allergy_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES public."Hospital"(id);
ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."BodyMeasurement"
    ADD CONSTRAINT "BodyMeasurement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."BodyMeasurement"
    ADD CONSTRAINT "BodyMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."CategoryBudget"
    ADD CONSTRAINT "CategoryBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."DashboardPreference"
    ADD CONSTRAINT "DashboardPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."EmergencyContact"
    ADD CONSTRAINT "EmergencyContact_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."EmergencyContact"
    ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Examination"
    ADD CONSTRAINT "Examination_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Examination"
    ADD CONSTRAINT "Examination_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."HealthLog"
    ADD CONSTRAINT "HealthLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."HealthLog"
    ADD CONSTRAINT "HealthLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Hospital"
    ADD CONSTRAINT "Hospital_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Insurance"
    ADD CONSTRAINT "Insurance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Insurance"
    ADD CONSTRAINT "Insurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."MedicationRecord"
    ADD CONSTRAINT "MedicationRecord_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES public."Medication"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."MedicationRecord"
    ADD CONSTRAINT "MedicationRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."MedicationRecord"
    ADD CONSTRAINT "MedicationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Medication"
    ADD CONSTRAINT "Medication_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."NotificationSetting"
    ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES public."Prescription"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES public."Medication"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."TemperatureRecord"
    ADD CONSTRAINT "TemperatureRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."TemperatureRecord"
    ADD CONSTRAINT "TemperatureRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Vaccination"
    ADD CONSTRAINT "Vaccination_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."Vaccination"
    ADD CONSTRAINT "Vaccination_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
