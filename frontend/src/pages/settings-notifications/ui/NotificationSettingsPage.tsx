import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { api } from "@/shared/api";
import { queryKeys } from "@/shared/api";
import type { NotificationSetting } from "@/shared/api";
import {
  NotificationSettingsForm,
  type UpdateNotificationSettingInput,
} from "./NotificationSettingsForm";

export default function NotificationSettingsPage() {
  const qc = useQueryClient();

  const { data: setting = null, isLoading, error } = useQuery({
    queryKey: queryKeys.notificationSettings.all,
    queryFn: () => api.get<NotificationSetting>("/notification-settings"),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateNotificationSettingInput) =>
      api.put<NotificationSetting>("/notification-settings", input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notificationSettings.all }),
  });

  const handleSave = async (input: UpdateNotificationSettingInput) => {
    await updateMutation.mutateAsync(input);
  };

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

      <NotificationSettingsForm setting={setting} onSave={handleSave} isLoading={isLoading} />
    </div>
  );
}
