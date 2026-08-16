import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useNotificationSetting } from "@/entities/notification-setting";
import { NotificationSettingsForm } from "@/features/update-notification-settings";

export default function NotificationSettingsPage() {
  const { data: setting = null, isLoading, error } = useNotificationSetting();

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Link
          to="/settings"
          className="p-1 text-ink-500 hover:text-ink-700 transition-colors"
          aria-label="設定に戻る"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-ink-800">通知設定</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          設定の読み込みに失敗しました
        </div>
      )}

      <NotificationSettingsForm setting={setting} isLoading={isLoading} />
    </div>
  );
}
