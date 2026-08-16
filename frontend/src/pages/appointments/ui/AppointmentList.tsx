import React, { useMemo } from "react";
import { Calendar, MapPin, Pencil, Trash2, User } from "lucide-react";
import type { Appointment } from "@/shared/api";
import { LoadingSpinner } from "@/shared/ui";
import { EmptyStatePrompt } from "@/shared/ui";
import { APPOINTMENT_TYPE_LABELS } from "./AppointmentForm";

export type AppointmentFilter = "upcoming" | "past";

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
  filter?: AppointmentFilter;
  memberNameOf: (memberId: string) => string;
  hospitalNameOf: (hospitalId: string | null) => string;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
}

const DAY_OF_WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function toStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getAppointmentDate(appointment: Appointment): Date {
  const d = new Date(appointment.appointmentDate);
  if (!Number.isNaN(d.getTime())) return d;
  const fallback = new Date(appointment.createdAt);
  return !Number.isNaN(fallback.getTime()) ? fallback : new Date(0);
}

function isToday(appointment: Appointment): boolean {
  return toStartOfDay(new Date()).getTime() === toStartOfDay(getAppointmentDate(appointment)).getTime();
}

function isPast(appointment: Appointment): boolean {
  return toStartOfDay(getAppointmentDate(appointment)).getTime() < toStartOfDay(new Date()).getTime();
}

function daysUntil(appointment: Appointment): number {
  const diffMs = toStartOfDay(getAppointmentDate(appointment)).getTime() - toStartOfDay(new Date()).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(appointment: Appointment): string {
  const d = getAppointmentDate(appointment);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${DAY_OF_WEEK_LABELS[d.getDay()]})`;
}

function getTypeLabel(type: string | null): string {
  if (!type) return "";
  return APPOINTMENT_TYPE_LABELS[type] || type;
}

export function getAppointmentCounts(appointments: Appointment[]): { upcoming: number; past: number } {
  let upcoming = 0;
  let past = 0;
  for (const a of appointments) {
    if (isPast(a)) past++;
    else upcoming++;
  }
  return { upcoming, past };
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  isLoading,
  filter,
  memberNameOf,
  hospitalNameOf,
  onEdit,
  onDelete,
}) => {
  const { upcoming, past } = useMemo(() => {
    const up: Appointment[] = [];
    const pa: Appointment[] = [];
    for (const a of appointments) {
      if (isPast(a)) pa.push(a);
      else up.push(a);
    }
    return { upcoming: up, past: pa };
  }, [appointments]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (appointments.length === 0) {
    return (
      <EmptyStatePrompt
        message="通院予定がありません"
        subMessage="上の＋ボタンから通院予定を追加できます"
      />
    );
  }

  const renderCard = (apt: Appointment) => (
    <AppointmentCard
      key={apt.id}
      appointment={apt}
      memberNameOf={memberNameOf}
      hospitalNameOf={hospitalNameOf}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );

  if (filter === "upcoming") {
    return (
      <div className="space-y-2">
        {upcoming.length > 0 ? (
          upcoming.map(renderCard)
        ) : (
          <p className="text-sm text-ink-500 text-center py-8">今後の予定はありません</p>
        )}
      </div>
    );
  }

  if (filter === "past") {
    return (
      <div className="space-y-2">
        {past.length > 0 ? (
          past.map(renderCard)
        ) : (
          <p className="text-sm text-ink-500 text-center py-8">過去の予定はありません</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink-600 mb-2 px-1">今後の予定</h3>
          <div className="space-y-2">{upcoming.map(renderCard)}</div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink-400 mb-2 px-1">過去の予定</h3>
          <div className="space-y-2 opacity-60">{past.map(renderCard)}</div>
        </div>
      )}
    </div>
  );
};

interface AppointmentCardProps {
  appointment: Appointment;
  memberNameOf: (memberId: string) => string;
  hospitalNameOf: (hospitalId: string | null) => string;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = React.memo(
  ({ appointment, memberNameOf, hospitalNameOf, onEdit, onDelete }) => {
    const days = daysUntil(appointment);
    const typeLabel = getTypeLabel(appointment.appointmentType);
    const today = isToday(appointment);
    const past = isPast(appointment);
    const memberName = memberNameOf(appointment.memberId);
    const hospitalName = hospitalNameOf(appointment.hospitalId);

    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              <Calendar size={18} className={today ? "text-red-500" : "text-primary-600"} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-ink-800 text-sm">
                {formatDate(appointment)}
                {today && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                    今日
                  </span>
                )}
                {!past && !today && days <= 7 && (
                  <span className="ml-2 text-xs text-orange-600 font-medium">あと{days}日</span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500 mt-1">
                {memberName && (
                  <span className="flex items-center space-x-1">
                    <User size={12} />
                    <span>{memberName}</span>
                  </span>
                )}
                {hospitalName && (
                  <span className="flex items-center space-x-1">
                    <MapPin size={12} />
                    <span>{hospitalName}</span>
                  </span>
                )}
                {typeLabel && <span>{typeLabel}</span>}
              </div>
              {appointment.description && (
                <p className="text-xs text-ink-400 mt-1">{appointment.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => onEdit(appointment)}
              className="text-ink-400 hover:text-primary-500 p-1 transition-colors"
              aria-label="編集"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(appointment.id)}
              className="text-ink-400 hover:text-red-500 p-1 transition-colors"
              aria-label="削除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  },
);

AppointmentCard.displayName = "AppointmentCard";
