-- 処方明細（処方箋の行データ：薬ごとの用量/頻度/日数）。既存DBに安全な no-op。
CREATE TABLE IF NOT EXISTS "PrescriptionItem" (
    "id"             TEXT PRIMARY KEY,
    "prescriptionId" TEXT NOT NULL REFERENCES "Prescription"("id") ON DELETE CASCADE,
    "name"           TEXT NOT NULL,
    "dosage"         TEXT,
    "frequency"      TEXT,
    "days"           INTEGER,
    "sortOrder"      INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");
