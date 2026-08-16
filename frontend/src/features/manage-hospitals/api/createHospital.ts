import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Hospital } from "@/shared/api";

export interface HospitalFormData {
  name: string;
  address?: string;
  phone?: string;
  department?: string;
  doctorName?: string;
  notes?: string;
}

/** 病院を追加し、一覧キャッシュを無効化する。 */
export function useCreateHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HospitalFormData) =>
      api.post<Hospital>("/hospitals", {
        name: data.name,
        address: data.address,
        phone: data.phone,
        department: data.department,
        doctorName: data.doctorName,
        notes: data.notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.hospitals.all });
    },
  });
}
