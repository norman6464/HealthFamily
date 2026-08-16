import React from "react";
import { AlertTriangle } from "lucide-react";
import { getRemainingDaysLabel, type StockAlert } from "../model/dashboard";

interface StockAlertListProps {
  alerts: StockAlert[];
  isLoading: boolean;
}

export const StockAlertList: React.FC<StockAlertListProps> = ({ alerts, isLoading }) => {
  if (isLoading || alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <AlertTriangle size={18} className="text-yellow-600" />
        <h2 className="text-lg font-semibold text-ink-800">在庫アラート</h2>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <StockAlertItem key={alert.medicationId} alert={alert} />
        ))}
      </div>
    </div>
  );
};

interface StockAlertItemProps {
  alert: StockAlert;
}

const StockAlertItem: React.FC<StockAlertItemProps> = React.memo(({ alert }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm p-3 border ${
      alert.isOverdue ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-ink-800">{alert.medicationName}</p>
        <p className="text-xs text-ink-500">{alert.memberName}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-ink-700">
          {getRemainingDaysLabel(alert.remainingDays ?? null)}
        </p>
        {alert.stockQuantity !== null && (
          <p className="text-xs text-ink-400">残{alert.stockQuantity}錠</p>
        )}
        <p className={`text-xs font-medium ${alert.isOverdue ? "text-red-600" : "text-yellow-600"}`}>
          {alert.isOverdue ? "期限超過" : `あと${alert.daysUntilAlert}日`}
        </p>
      </div>
    </div>
  </div>
));

StockAlertItem.displayName = "StockAlertItem";
