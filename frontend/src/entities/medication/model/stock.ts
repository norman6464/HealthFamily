import type { Medication } from "@/shared/api";

/**
 * 在庫が警告日までの残り日数に足りているかを判定する。
 * 警告日を過ぎている場合は在庫少とみなさない (別途の期限超過表示に任せる)。
 */
export function isLowStock(medication: Medication): boolean {
  if (
    medication.stockQuantity === null ||
    medication.stockQuantity === undefined ||
    !medication.stockAlertDate
  ) {
    return false;
  }
  const today = new Date();
  const alertDate = new Date(medication.stockAlertDate);
  const daysUntilAlert = Math.ceil(
    (alertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysUntilAlert <= 0) return false;
  return medication.stockQuantity < daysUntilAlert;
}
