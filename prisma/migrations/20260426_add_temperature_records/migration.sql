-- CreateTable
CREATE TABLE "TemperatureRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemperatureRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemperatureRecord_userId_idx" ON "TemperatureRecord"("userId");

-- CreateIndex
CREATE INDEX "TemperatureRecord_memberId_idx" ON "TemperatureRecord"("memberId");

-- CreateIndex
CREATE INDEX "TemperatureRecord_memberId_measuredAt_idx" ON "TemperatureRecord"("memberId", "measuredAt");

-- AddForeignKey
ALTER TABLE "TemperatureRecord" ADD CONSTRAINT "TemperatureRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureRecord" ADD CONSTRAINT "TemperatureRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
