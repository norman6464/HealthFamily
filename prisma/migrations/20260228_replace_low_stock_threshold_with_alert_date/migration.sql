-- AlterTable
ALTER TABLE "Medication" DROP COLUMN "lowStockThreshold",
ADD COLUMN "stockAlertDate" TIMESTAMP(3);
