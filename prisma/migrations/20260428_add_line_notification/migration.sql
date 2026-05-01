-- AlterTable
ALTER TABLE "User" ADD COLUMN "lineUserId" TEXT,
ADD COLUMN "lineLinkCode" TEXT,
ADD COLUMN "lineLinkCodeExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_lineUserId_key" ON "User"("lineUserId");

-- AlterTable
ALTER TABLE "NotificationSetting" ADD COLUMN "lineNotificationEnabled" BOOLEAN NOT NULL DEFAULT false;
