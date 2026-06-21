-- HealthFamily 初期スキーマ (生SQL / PostgreSQL)
-- Prisma schema.prisma と同等のテーブル構成。ID は text(UUID), 配列は text[]。

CREATE TABLE IF NOT EXISTS users (
    id                    TEXT PRIMARY KEY,
    email                 TEXT NOT NULL UNIQUE,
    password              TEXT NOT NULL,
    display_name          TEXT,
    character_type        TEXT NOT NULL DEFAULT 'cat',
    character_name        TEXT,
    email_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code     TEXT,
    verification_expiry   TIMESTAMPTZ,
    verification_attempts INTEGER NOT NULL DEFAULT 0,
    reset_code            TEXT,
    reset_code_expiry     TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_type TEXT NOT NULL DEFAULT 'human',
    name        TEXT NOT NULL,
    pet_type    TEXT,
    photo_url   TEXT,
    birth_date  TIMESTAMPTZ,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

CREATE TABLE IF NOT EXISTS medications (
    id               TEXT PRIMARY KEY,
    member_id        TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    user_id          TEXT NOT NULL,
    name             TEXT NOT NULL,
    category         TEXT NOT NULL DEFAULT 'regular',
    dosage_amount    TEXT,
    frequency        TEXT,
    stock_quantity   INTEGER,
    stock_alert_date TIMESTAMPTZ,
    interval_hours   INTEGER,
    instructions     TEXT,
    display_order    INTEGER NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    status           TEXT NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_medications_member_id ON medications(member_id);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);

CREATE TABLE IF NOT EXISTS schedules (
    id                      TEXT PRIMARY KEY,
    medication_id           TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    user_id                 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id               TEXT NOT NULL,
    scheduled_time          TEXT NOT NULL,
    days_of_week            TEXT[] NOT NULL DEFAULT '{}',
    interval_days           INTEGER,
    start_date              TIMESTAMPTZ,
    is_enabled              BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_minutes_before INTEGER NOT NULL DEFAULT 5,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_medication_id ON schedules(medication_id);

CREATE TABLE IF NOT EXISTS medication_records (
    id            TEXT PRIMARY KEY,
    member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    medication_id TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_id   TEXT,
    taken_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes         TEXT,
    dosage_amount TEXT
);
CREATE INDEX IF NOT EXISTS idx_medication_records_user_id ON medication_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_member_id ON medication_records(member_id);

CREATE TABLE IF NOT EXISTS hospitals (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    hospital_type TEXT,
    address       TEXT,
    phone_number  TEXT,
    department    TEXT,
    doctor_name   TEXT,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON hospitals(user_id);

CREATE TABLE IF NOT EXISTS health_logs (
    id              TEXT PRIMARY KEY,
    member_id       TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    condition_level INTEGER NOT NULL,
    symptoms        TEXT[] NOT NULL DEFAULT '{}',
    notes           TEXT,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_health_logs_user_id ON health_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_health_logs_member_id ON health_logs(member_id);

CREATE TABLE IF NOT EXISTS appointments (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id            TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    hospital_id          TEXT REFERENCES hospitals(id),
    appointment_type     TEXT,
    appointment_date     TIMESTAMPTZ NOT NULL,
    description          TEXT,
    test_results         TEXT,
    cost                 DOUBLE PRECISION,
    reminder_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_days_before INTEGER NOT NULL DEFAULT 1,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_member_id ON appointments(member_id);

CREATE TABLE IF NOT EXISTS vaccinations (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id           TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    vaccine_name        TEXT NOT NULL,
    vaccinated_at       TIMESTAMPTZ NOT NULL,
    next_scheduled_date TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vaccinations_user_id ON vaccinations(user_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_member_id ON vaccinations(member_id);

CREATE TABLE IF NOT EXISTS examinations (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id           TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    examination_type    TEXT NOT NULL,
    examined_at         TIMESTAMPTZ NOT NULL,
    next_scheduled_date TIMESTAMPTZ,
    notes               TEXT,
    image_data          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_examinations_user_id ON examinations(user_id);
CREATE INDEX IF NOT EXISTS idx_examinations_member_id ON examinations(member_id);

CREATE TABLE IF NOT EXISTS insurances (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id      TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    insurance_type TEXT NOT NULL,
    provider_name  TEXT,
    policy_number  TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insurances_user_id ON insurances(user_id);
CREATE INDEX IF NOT EXISTS idx_insurances_member_id ON insurances(member_id);

CREATE TABLE IF NOT EXISTS allergies (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    allergen_name TEXT NOT NULL,
    allergy_type  TEXT NOT NULL,
    severity      TEXT NOT NULL,
    symptoms      TEXT,
    diagnosed_at  TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_allergies_user_id ON allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_allergies_member_id ON allergies(member_id);

CREATE TABLE IF NOT EXISTS body_measurements (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    weight      DOUBLE PRECISION,
    height      DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_member_id ON body_measurements(member_id);

CREATE TABLE IF NOT EXISTS temperature_records (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    temperature DOUBLE PRECISION NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_temperature_records_user_id ON temperature_records(user_id);
CREATE INDEX IF NOT EXISTS idx_temperature_records_member_id ON temperature_records(member_id);
CREATE INDEX IF NOT EXISTS idx_temperature_records_member_measured ON temperature_records(member_id, measured_at);

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id    TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    relationship TEXT,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_member_id ON emergency_contacts(member_id);

CREATE TABLE IF NOT EXISTS prescriptions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    image_data  TEXT,
    notes       TEXT,
    prescribed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_member_id ON prescriptions(member_id);

CREATE TABLE IF NOT EXISTS notification_settings (
    id                    TEXT PRIMARY KEY,
    user_id               TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    push_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
    email_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
