import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TodaySchedule } from "@/lib/types";
import { Card } from "@/components/ui";

export default function Home() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["schedules", "today"],
    queryFn: () => api.get<TodaySchedule[]>("/schedules/today"),
  });

  const takeMutation = useMutation({
    mutationFn: (s: TodaySchedule) =>
      api.post("/records", { medicationId: s.medicationId, scheduleId: s.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules", "today"] }),
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-500">こんにちは</p>
        <h1 className="text-2xl font-bold text-slate-800">
          {user?.displayName ?? "ご家族"} さん
        </h1>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-600">今日のおくすり</h2>
        {isLoading ? (
          <p className="text-sm text-slate-400">読み込み中...</p>
        ) : !schedules || schedules.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-400">今日の服薬予定はありません</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {schedules.map((s) => (
              <Card key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{s.medicationName}</p>
                  <p className="text-xs text-slate-500">
                    {s.memberName}・{s.scheduledTime}
                  </p>
                </div>
                <button
                  disabled={s.isCompleted || takeMutation.isPending}
                  onClick={() => takeMutation.mutate(s)}
                  className={clsx(
                    "flex h-10 w-10 items-center justify-center rounded-full transition",
                    s.isCompleted
                      ? "bg-green-100 text-green-600"
                      : "bg-slate-100 text-slate-400 hover:bg-primary hover:text-white",
                  )}
                  aria-label="服薬完了"
                >
                  <Check className="h-5 w-5" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
