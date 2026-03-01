import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Appointment } from '../../domain/entities/Appointment';

interface NextAppointmentBannerProps {
  appointments: Appointment[];
}

export const NextAppointmentBanner: React.FC<NextAppointmentBannerProps> = ({ appointments }) => {
  const nextAppointment = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = appointments
      .filter((a) => new Date(a.appointmentDate) >= now)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    return upcoming[0] ?? null;
  }, [appointments]);

  if (!nextAppointment) return null;

  const date = new Date(nextAppointment.appointmentDate);
  const formatted = `${date.getMonth() + 1}/${date.getDate()}`;

  return (
    <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
      <div className="flex items-center space-x-3">
        <Calendar size={18} className="text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-800 truncate">
            {nextAppointment.memberName && <span>{nextAppointment.memberName}</span>}
            {nextAppointment.hospitalName && <span> - {nextAppointment.hospitalName}</span>}
          </p>
          <p className="text-xs text-blue-600">{formatted}</p>
        </div>
      </div>
    </div>
  );
};
