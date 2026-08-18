import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import {
  INTERACTION_DISCLAIMER,
  type InteractionLevel,
  type InteractionWarning as InteractionWarningItem,
} from "../model/interactions";

interface InteractionWarningListProps {
  warnings: InteractionWarningItem[];
}

const LEVEL_STYLES: Record<
  InteractionLevel,
  { container: string; title: string; detail: string; chip: string; iconColor: string }
> = {
  danger: {
    container: "border-red-200 bg-red-50",
    title: "text-red-700",
    detail: "text-red-600",
    chip: "bg-red-100 text-red-700",
    iconColor: "text-red-500",
  },
  warning: {
    container: "border-amber-200 bg-amber-50",
    title: "text-amber-700",
    detail: "text-amber-600",
    chip: "bg-amber-100 text-amber-700",
    iconColor: "text-amber-500",
  },
  info: {
    container: "border-primary-200 bg-primary-50",
    title: "text-primary-700",
    detail: "text-primary-700/80",
    chip: "bg-primary-100 text-primary-700",
    iconColor: "text-primary-500",
  },
};

const LEVEL_LABEL: Record<InteractionLevel, string> = {
  danger: "要注意",
  warning: "注意",
  info: "参考",
};

function LevelIcon({ level, className }: { level: InteractionLevel; className?: string }) {
  if (level === "info") return <Info size={16} className={className} />;
  return <AlertTriangle size={16} className={className} />;
}

export function InteractionWarningList({ warnings }: InteractionWarningListProps) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-400/10 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary-500 shrink-0" />
          <p className="text-sm text-ink-500">重大な飲み合わせは検出されませんでした</p>
        </div>
        <p className="mt-2 text-xs text-ink-400">{INTERACTION_DISCLAIMER}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {warnings.map((warning, index) => {
        const styles = LEVEL_STYLES[warning.level];
        return (
          <div
            key={`${warning.title}-${index}`}
            className={`rounded-2xl border p-4 shadow-soft ${styles.container}`}
          >
            <div className="flex items-start gap-2">
              <LevelIcon level={warning.level} className={`mt-0.5 shrink-0 ${styles.iconColor}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles.chip}`}
                  >
                    {LEVEL_LABEL[warning.level]}
                  </span>
                  <h3 className={`text-sm font-semibold ${styles.title}`}>{warning.title}</h3>
                </div>
                <p className={`mt-1.5 text-xs leading-relaxed ${styles.detail}`}>
                  {warning.detail}
                </p>
                {warning.drugs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {warning.drugs.map((drug) => (
                      <span
                        key={drug}
                        className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-ink-600 border border-ink-400/10"
                      >
                        {drug}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <p className="px-1 text-xs text-ink-400">{INTERACTION_DISCLAIMER}</p>
    </div>
  );
}
