import React from 'react';
import Link from 'next/link';
import { Calendar, User, MapPin } from 'lucide-react';
import { Appointment, AppointmentEntity } from '../../domain/entities/Appointment';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  isLoading: boolean;
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({ appointments, isLoading }) => {
  if (isLoading) return null;

  const upcoming = appointments
    .filter((a) => {
      const entity = new AppointmentEntity(a);
      return !entity.isPast() && entity.daysUntil() <= 7;
    })
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">今後の通院予定</h2>
        <Link href="/appointments" className="text-xs text-primary-600 hover:underline">
          すべて見る
        </Link>
      </div>
      <div className="space-y-2">
        {upcoming.map((apt) => {
          const entity = new AppointmentEntity(apt);
          const daysUntil = entity.daysUntil();
          return (
            <div key={apt.id} className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
              <div className="flex items-center space-x-3">
                <Calendar size={16} className={entity.isToday() ? 'text-red-500' : 'text-primary-600'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {entity.getFormattedDate()}
                    {entity.isToday() && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        今日
                      </span>
                    )}
                    {!entity.isToday() && daysUntil <= 3 && (
                      <span className="ml-2 text-xs text-orange-600 font-medium">
                        あと{daysUntil}日
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
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
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
