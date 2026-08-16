import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Appointment } from "@/shared/api";
import type { AppointmentFormData } from "@/entities/appointment";

/**
 * 通院予約を更新し、一覧キャッシュを無効化する。
 * メンバーの付け替えは想定していないため memberId は送らない。
 */
export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentFormData }) =>
      api.patch<Appointment>(`/appointments/${id}`, {
        appointmentDate: new Date(data.appointmentDate).toISOString(),
        hospitalId: data.hospitalId,
        type: data.type,
        notes: data.notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });
}
