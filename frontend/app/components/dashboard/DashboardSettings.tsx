import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, X } from "lucide-react";
import { api } from "@/lib/api";
import type { DashboardPreference, Member } from "@/lib/types";
import { Button, Card, ErrorText } from "@/components/ui";

// ダッシュボードで制御可能なカード(greeting は常時表示のため対象外)
export const DASHBOARD_CARD_KEYS = [
  "weeklySummary",
  "missedDoses",
  "todaySchedule",
  "stockAlerts",
  "adherence",
  "upcomingAppointments",
] as const;

export type DashboardCardKey = (typeof DASHBOARD_CARD_KEYS)[number];

// 並び替え対象となる下部カード
export const ORDERABLE_CARD_KEYS: readonly DashboardCardKey[] = [
  "stockAlerts",
  "adherence",
  "upcomingAppointments",
];

const CARD_LABELS: Record<DashboardCardKey, string> = {
  weeklySummary: "今週のサマリー",
  missedDoses: "飲み忘れアラート",
  todaySchedule: "今日の予定",
  stockAlerts: "在庫アラート",
  adherence: "服薬達成率",
  upcomingAppointments: "次回の通院予定",
};

interface DashboardSettingsProps {
  preference: DashboardPreference;
  members: Member[];
  onClose: () => void;
}

export function DashboardSettings({ preference, members, onClose }: DashboardSettingsProps) {
  const qc = useQueryClient();

  const [hiddenCards, setHiddenCards] = useState<string[]>(preference.hiddenCards);
  const [defaultMemberId, setDefaultMemberId] = useState<string | null>(
    preference.defaultMemberId,
  );
  // 並び替え対象キーのみを安定順序で保持する
  const [order, setOrder] = useState<DashboardCardKey[]>(() =>
    buildOrder(preference.cardOrder),
  );

  // preference が外部更新された場合に追従する
  useEffect(() => {
    setHiddenCards(preference.hiddenCards);
    setDefaultMemberId(preference.defaultMemberId);
    setOrder(buildOrder(preference.cardOrder));
  }, [preference]);

  const hiddenSet = useMemo(() => new Set(hiddenCards), [hiddenCards]);

  const mutation = useMutation({
    mutationFn: (input: {
      hiddenCards: string[];
      cardOrder: string[];
      defaultMemberId: string | null;
    }) => api.put<DashboardPreference>("/dashboard-preferences", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-preferences"] });
      onClose();
    },
  });

  const toggleCard = (key: DashboardCardKey) => {
    setHiddenCards((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const moveCard = (index: number, direction: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = () => {
    mutation.mutate({
      hiddenCards,
      cardOrder: order,
      defaultMemberId,
    });
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink-800">ダッシュボードの表示設定</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-ink-400 transition hover:bg-primary-50 hover:text-ink-700"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>

      {/* 表示/非表示トグル */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink-700">表示するカード</h3>
        <ul className="space-y-1.5">
          {DASHBOARD_CARD_KEYS.map((key) => {
            const visible = !hiddenSet.has(key);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => toggleCard(key)}
                  className="flex w-full items-center justify-between rounded-xl border border-ink-400/10 bg-white px-3.5 py-2.5 text-sm text-ink-800 transition hover:bg-primary-50"
                  aria-pressed={visible}
                >
                  <span className={visible ? "" : "text-ink-400 line-through"}>
                    {CARD_LABELS[key]}
                  </span>
                  {visible ? (
                    <span className="flex items-center gap-1 text-primary-700">
                      <Eye size={16} />
                      <span className="text-xs font-medium">表示</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-ink-400">
                      <EyeOff size={16} />
                      <span className="text-xs font-medium">非表示</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 既定メンバー */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink-700">既定の表示メンバー</h3>
        <select
          value={defaultMemberId ?? ""}
          onChange={(e) => setDefaultMemberId(e.target.value === "" ? null : e.target.value)}
          className="w-full rounded-xl border border-ink-400/30 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label="既定の表示メンバー"
        >
          <option value="">指定しない(全員)</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </section>

      {/* 並び替え */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink-700">下部カードの並び順</h3>
        <ul className="space-y-1.5">
          {order.map((key, index) => (
            <li
              key={key}
              className="flex items-center justify-between rounded-xl border border-ink-400/10 bg-white px-3.5 py-2.5 text-sm text-ink-800"
            >
              <span>{CARD_LABELS[key]}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveCard(index, -1)}
                  disabled={index === 0}
                  className="rounded-lg p-1.5 text-ink-600 transition hover:bg-primary-50 disabled:opacity-30"
                  aria-label={`${CARD_LABELS[key]}を上へ`}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => moveCard(index, 1)}
                  disabled={index === order.length - 1}
                  className="rounded-lg p-1.5 text-ink-600 transition hover:bg-primary-50 disabled:opacity-30"
                  aria-label={`${CARD_LABELS[key]}を下へ`}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {mutation.isError && (
        <ErrorText>
          {mutation.error instanceof Error
            ? mutation.error.message
            : "保存に失敗しました"}
        </ErrorText>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          <Check size={16} />
          {mutation.isPending ? "保存中..." : "保存"}
        </Button>
      </div>
    </Card>
  );
}

// 保存済みの cardOrder を基に、並び替え対象キーの順序を確定する。
// 未知キーは無視し、欠落キーは既定順序の末尾に補完する。
function buildOrder(savedOrder: string[]): DashboardCardKey[] {
  const orderable = new Set<DashboardCardKey>(ORDERABLE_CARD_KEYS);
  const result: DashboardCardKey[] = [];
  for (const key of savedOrder) {
    if (orderable.has(key as DashboardCardKey) && !result.includes(key as DashboardCardKey)) {
      result.push(key as DashboardCardKey);
    }
  }
  for (const key of ORDERABLE_CARD_KEYS) {
    if (!result.includes(key)) result.push(key);
  }
  return result;
}
