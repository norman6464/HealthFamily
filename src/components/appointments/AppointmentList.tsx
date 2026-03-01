'use client';

import React from 'react';
import { Calendar, Trash2, User, MapPin } from 'lucide-react';
import { Appointment, AppointmentEntity } from '../../domain/entities/Appointment';

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
  onDelete: (appointmentId: string) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, isLoading, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <p className="text-gray-500 text-lg">通院予定がありません</p>
      </div>
    );
  }

  const upcoming = appointments.filter((a) => !new AppointmentEntity(a).isPast());
  const past = appointments.filter((a) => new AppointmentEntity(a).isPast());

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 px-1">今後の予定</h3>
          <div className="space-y-2">
            {upcoming.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2 px-1">過去の予定</h3>
          <div className="space-y-2 opacity-60">
            {past.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface AppointmentCardProps {
  appointment: Appointment;
  onDelete: (appointmentId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onDelete }) => {
  const entity = new AppointmentEntity(appointment);
  const daysUntil = entity.daysUntil();
  const typeLabel = entity.getTypeLabel();

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">
            <Calendar size={18} className={entity.isToday() ? 'text-red-500' : 'text-primary-600'} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 text-sm">
              {entity.getFormattedDate()}
              {entity.isToday() && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                  今日
                </span>
              )}
              {!entity.isPast() && !entity.isToday() && daysUntil <= 7 && (
                <span className="ml-2 text-xs text-orange-600 font-medium">
                  あと{daysUntil}日
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
              {appointment.memberName && (
                <span className="flex items-center space-x-1">
                  <User size={12} />
                  <span>{appointment.memberName}</span>
                </span>
              )}
              {appointment.hospitalName && (
                <span className="flex items-center space-x-1">
                  <MapPin size={12} />
                  <span>{appointment.hospitalName}</span>
                </span>
              )}
              {typeLabel && <span>{typeLabel}</span>}
            </div>
            {appointment.description && (
              <p className="text-xs text-gray-400 mt-1">{appointment.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(appointment.id)}
          className="text-gray-400 hover:text-red-500 p-1 transition-colors flex-shrink-0"
          aria-label="削除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
