-- Add status column to Medication for 休薬/中止 display
ALTER TABLE "Medication" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
