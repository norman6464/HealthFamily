import React from "react";
import { Link } from "react-router";
import { Calendar, User, MapPin } from "lucide-react";
import type { EnrichedAppointment } from "@/hooks/dashboard";

interface UpcomingAppointmentsProps {
  appointments: EnrichedAppointment[];
  isLoading: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  checkup: "定期検診",
  treatment: "治療",
  vaccination: "予防接種",
  surgery: "手術",
  consultation: "相談",
  medication_pickup: "お薬",
  examination: "検査",
  flea_tick: "ノミ・ダニ薬",
  heartworm: "フィラリア",
  therapeutic_diet: "療養食",
  grooming: "トリミング",
  other: "その他",
};

const DAY_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

function toStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(from: Date, to: Date): number {
  const a = toStartOfDay(from).getTime();
  const b = toStartOfDay(to).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function isToday(date: Date): boolean {
  return toStartOfDay(new Date()).getTime() === toStartOfDay(date).getTime();
}

function isPast(date: Date): boolean {
  return toStartOfDay(date).getTime() < toStartOfDay(new Date()).getTime();
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${DAY_OF_WEEK[date.getDay()]})`;
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments,
  isLoading,
}) => {
  if (isLoading) return null;

  const upcoming = appointments
    .map((a) => ({ apt: a, date: new Date(a.appointmentDate) }))
    .filter(({ date }) => !isPast(date) && diffDays(new Date(), date) <= 7)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-ink-800">今後の通院予定</h2>
        <Link to="/appointments" className="text-xs text-primary hover:underline">
          すべて見る
        </Link>
      </div>
      <div className="space-y-2">
        {upcoming.map(({ apt, date }) => {
          const daysUntil = diffDays(new Date(), date);
          const today = isToday(date);
          return (
            <div key={apt.id} className="bg-white rounded-2xl shadow-sm p-3 border border-primary-100">
              <div className="flex items-center space-x-3">
                <Calendar size={16} className={today ? "text-red-500" : "text-primary"} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800">
                    {formatDate(date)}
                    {today && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        今日
                      </span>
                    )}
                    {!today && daysUntil <= 3 && (
                      <span className="ml-2 text-xs text-orange-600 font-medium">
                        あと{daysUntil}日
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-ink-500 mt-0.5 flex-wrap">
                    {apt.memberName && (
                      <span className="flex items-center space-x-1">
                        <User size={10} />
                        <span>{apt.memberName}</span>
                      </span>
                    )}
                    {apt.hospitalName && (
                      <span className="flex items-center space-x-1">
                        <MapPin size={10} />
                        <span>{apt.hospitalName}</span>
                      </span>
                    )}
                    {apt.appointmentType && TYPE_LABELS[apt.appointmentType] && (
                      <span className="px-1.5 py-0.5 bg-primary-50 text-ink-600 rounded text-xs">
                        {TYPE_LABELS[apt.appointmentType]}
                      </span>
                    )}
                  </div>
                  {apt.description && (
                    <p className="text-xs text-ink-400 mt-0.5 truncate">{apt.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
