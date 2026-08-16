import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Appointment } from "@/shared/api";
import type { AppointmentFormData } from "@/entities/appointment";

/** 通院予約を追加し、一覧キャッシュを無効化する。 */
export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentFormData) =>
      api.post<Appointment>("/appointments", {
        memberId: data.memberId,
        hospitalId: data.hospitalId,
        appointmentDate: new Date(data.appointmentDate).toISOString(),
        type: data.type,
        notes: data.notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });
}
