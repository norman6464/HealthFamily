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
ALTER TABLE ONLY public."MedicationRecord"
    ADD CONSTRAINT "MedicationRecord_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Medication"
    ADD CONSTRAINT "Medication_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);
ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
CREATE INDEX "MedicationRecord_memberId_idx" ON public."MedicationRecord" USING btree ("memberId");
CREATE INDEX "MedicationRecord_userId_idx" ON public."MedicationRecord" USING btree ("userId");
CREATE INDEX "Medication_memberId_idx" ON public."Medication" USING btree ("memberId");
CREATE INDEX "Medication_userId_idx" ON public."Medication" USING btree ("userId");
CREATE INDEX "Member_userId_idx" ON public."Member" USING btree ("userId");
CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");
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
