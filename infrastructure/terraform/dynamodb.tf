# ===== 1. Users テーブル =====
resource "aws_dynamodb_table" "users" {
  name         = local.table_names.users
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.users
  }
}

# ===== 2. Members テーブル =====
resource "aws_dynamodb_table" "members" {
  name         = local.table_names.members
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "memberId"

  attribute {
    name = "memberId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "memberType"
    type = "S"
  }

  global_secondary_index {
    name            = "UserMembers-index"
    hash_key        = "userId"
    range_key       = "memberType"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.members
  }
}

# ===== 3. Medications テーブル =====
resource "aws_dynamodb_table" "medications" {
  name         = local.table_names.medications
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "medicationId"

  attribute {
    name = "medicationId"
    type = "S"
  }

  attribute {
    name = "memberId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  global_secondary_index {
    name            = "MemberMedications-index"
    hash_key        = "memberId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UserMedications-index"
    hash_key        = "userId"
    range_key       = "category"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.medications
  }
}

# ===== 4. Schedules テーブル =====
resource "aws_dynamodb_table" "schedules" {
  name         = local.table_names.schedules
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "scheduleId"

  attribute {
    name = "scheduleId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "scheduledTime"
    type = "S"
  }

  attribute {
    name = "medicationId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserSchedules-index"
    hash_key        = "userId"
    range_key       = "scheduledTime"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "MedicationSchedules-index"
    hash_key        = "medicationId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.schedules
  }
}

# ===== 5. MedicationRecords テーブル =====
resource "aws_dynamodb_table" "medication_records" {
  name         = local.table_names.medication_records
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "recordId"

  attribute {
    name = "recordId"
    type = "S"
  }

  attribute {
    name = "memberId"
    type = "S"
  }

  attribute {
    name = "takenAt"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "MemberRecords-index"
    hash_key        = "memberId"
    range_key       = "takenAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UserDailyRecords-index"
    hash_key        = "userId"
    range_key       = "takenAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.medication_records
  }
}

# ===== 6. Hospitals テーブル =====
resource "aws_dynamodb_table" "hospitals" {
  name         = local.table_names.hospitals
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "hospitalId"

  attribute {
    name = "hospitalId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "hospitalType"
    type = "S"
  }

  global_secondary_index {
    name            = "UserHospitals-index"
    hash_key        = "userId"
    range_key       = "hospitalType"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.hospitals
  }
}

# ===== 7. Appointments テーブル =====
resource "aws_dynamodb_table" "appointments" {
  name         = local.table_names.appointments
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "appointmentId"

  attribute {
    name = "appointmentId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "appointmentDate"
    type = "S"
  }

  attribute {
    name = "memberId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserAppointments-index"
    hash_key        = "userId"
    range_key       = "appointmentDate"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "MemberAppointments-index"
    hash_key        = "memberId"
    range_key       = "appointmentDate"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.appointments
  }
}

# ===== 8. MedicalHistory テーブル =====
resource "aws_dynamodb_table" "medical_history" {
  name         = local.table_names.medical_history
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "historyId"

  attribute {
    name = "historyId"
    type = "S"
  }

  attribute {
    name = "memberId"
    type = "S"
  }

  attribute {
    name = "historyType"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "MemberHistory-index"
    hash_key        = "memberId"
    range_key       = "historyType"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UserHistory-index"
    hash_key        = "userId"
    range_key       = "historyType"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.medical_history
  }
}

# ===== 9. NutritionRecords テーブル =====
resource "aws_dynamodb_table" "nutrition_records" {
  name         = local.table_names.nutrition_records
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "nutritionId"

  attribute {
    name = "nutritionId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "recordDate"
    type = "S"
  }

  global_secondary_index {
    name            = "UserNutrition-index"
    hash_key        = "userId"
    range_key       = "recordDate"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.nutrition_records
  }
}

# ===== 10. ExerciseRecords テーブル =====
resource "aws_dynamodb_table" "exercise_records" {
  name         = local.table_names.exercise_records
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "exerciseId"

  attribute {
    name = "exerciseId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "recordDate"
    type = "S"
  }

  global_secondary_index {
    name            = "UserExercises-index"
    hash_key        = "userId"
    range_key       = "recordDate"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection

  tags = {
    Name = local.table_names.exercise_records
  }
}
