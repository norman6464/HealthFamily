-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicationReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "missedMedicationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "appointmentReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lowStockAlertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultReminderMinutesBefore" INTEGER NOT NULL DEFAULT 5,
    "defaultAppointmentReminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "emailNotificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE INDEX "NotificationSetting_userId_idx" ON "NotificationSetting"("userId");

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
