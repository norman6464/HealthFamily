locals {
  # 命名プレフィックス: HealthFamily-dev, HealthFamily-staging, HealthFamily-prod
  name_prefix = "${var.project_name}-${var.environment}"

  # 全リソースに適用する共通タグ
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Repository  = "HealthFamily"
  }

  # アカウント・リージョン情報
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name

  # DynamoDBテーブル名マップ
  table_names = {
    users              = "${local.name_prefix}-Users"
    members            = "${local.name_prefix}-Members"
    medications        = "${local.name_prefix}-Medications"
    schedules          = "${local.name_prefix}-Schedules"
    medication_records = "${local.name_prefix}-MedicationRecords"
    hospitals          = "${local.name_prefix}-Hospitals"
    appointments       = "${local.name_prefix}-Appointments"
    medical_history    = "${local.name_prefix}-MedicalHistory"
    nutrition_records  = "${local.name_prefix}-NutritionRecords"
    exercise_records   = "${local.name_prefix}-ExerciseRecords"
  }

  # Lambda共通環境変数
  lambda_common_env_vars = {
    REGION                   = var.aws_region
    ENVIRONMENT              = var.environment
    USERS_TABLE              = local.table_names.users
    MEMBERS_TABLE            = local.table_names.members
    MEDICATIONS_TABLE        = local.table_names.medications
    SCHEDULES_TABLE          = local.table_names.schedules
    MEDICATION_RECORDS_TABLE = local.table_names.medication_records
    HOSPITALS_TABLE          = local.table_names.hospitals
    APPOINTMENTS_TABLE       = local.table_names.appointments
    MEDICAL_HISTORY_TABLE    = local.table_names.medical_history
    NUTRITION_RECORDS_TABLE  = local.table_names.nutrition_records
    EXERCISE_RECORDS_TABLE   = local.table_names.exercise_records
  }
}
