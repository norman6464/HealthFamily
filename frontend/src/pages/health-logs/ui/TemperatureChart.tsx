import React, { useMemo } from "react";
import type { TemperatureRecordView } from "../model/health-logs";

interface TemperatureChartProps {
  records: TemperatureRecordView[];
  /** 表示する直近日数 (デフォルト7日) */
  days?: number;
}

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 180;
const PADDING_LEFT = 32;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const PLOT_WIDTH = VIEWBOX_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

const Y_MIN = 35.0;
const Y_MAX = 40.0;
const Y_TICKS = [35, 36, 37, 38, 39, 40];
const FEVER_LINE = 37.5;

export const TemperatureChart: React.FC<TemperatureChartProps> = ({
  records,
  days = 7,
}) => {
  const { points, xLabels, hasData } = useMemo(() => {
    const now = new Date();
    const endTs = now.getTime();
    const startTs = endTs - days * 24 * 60 * 60 * 1000;

    const inRange = records.filter((r) => {
      const t = r.measuredAt.getTime();
      return t >= startTs && t <= endTs;
    });

    const sorted = [...inRange].sort(
      (a, b) => a.measuredAt.getTime() - b.measuredAt.getTime(),
    );

    const xFromTs = (ts: number) =>
      PADDING_LEFT + ((ts - startTs) / (endTs - startTs)) * PLOT_WIDTH;
    const yFromTemp = (temp: number) => {
      const clamped = Math.max(Y_MIN, Math.min(Y_MAX, temp));
      return PADDING_TOP + (1 - (clamped - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_HEIGHT;
    };

    const pts = sorted.map((r) => ({
      x: xFromTs(r.measuredAt.getTime()),
      y: yFromTemp(r.temperature),
      record: r,
    }));

    const labels: { x: number; label: string }[] = [];
    const labelCount = Math.min(days, 4);
    for (let i = 0; i < labelCount; i++) {
      const ts = startTs + ((endTs - startTs) * i) / (labelCount - 1 || 1);
      const d = new Date(ts);
      labels.push({
        x: xFromTs(ts),
        label: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }

    return { points: pts, xLabels: labels, hasData: sorted.length > 0 };
  }, [records, days]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
  }, [points]);

  const feverY =
    PADDING_TOP + (1 - (FEVER_LINE - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_HEIGHT;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 border border-primary-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-ink-700">
          体温推移（直近{days}日）
        </h3>
        <span className="text-xs text-ink-400">単位: °C</span>
      </div>
      {!hasData ? (
        <div className="py-8 text-center text-sm text-ink-400">
          この期間の体温記録はありません
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label="体温推移グラフ"
        >
          {Y_TICKS.map((t) => {
            const y =
              PADDING_TOP + (1 - (t - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_HEIGHT;
            return (
              <g key={t}>
                <line
                  x1={PADDING_LEFT}
                  x2={VIEWBOX_WIDTH - PADDING_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
                <text
                  x={PADDING_LEFT - 4}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={9}
                  fill="#9ca3af"
                >
                  {t}
                </text>
              </g>
            );
          })}

          <line
            x1={PADDING_LEFT}
            x2={VIEWBOX_WIDTH - PADDING_RIGHT}
            y1={feverY}
            y2={feverY}
            stroke="#fca5a5"
            strokeWidth={1}
            strokeDasharray="3 2"
          />
          <text
            x={VIEWBOX_WIDTH - PADDING_RIGHT}
            y={feverY - 2}
            textAnchor="end"
            fontSize={8}
            fill="#dc2626"
          >
            発熱境界 37.5
          </text>

          {xLabels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={VIEWBOX_HEIGHT - PADDING_BOTTOM + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#9ca3af"
            >
              {l.label}
            </text>
          ))}

          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#16a34a"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          )}

          {points.map((p) => (
            <circle
              key={p.record.id}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={p.record.temperature >= FEVER_LINE ? "#dc2626" : "#16a34a"}
            >
              <title>
                {p.record.measuredAt.toLocaleString("ja-JP")} -{" "}
                {p.record.temperature}°C
              </title>
            </circle>
          ))}
        </svg>
      )}
    </div>
  );
};
