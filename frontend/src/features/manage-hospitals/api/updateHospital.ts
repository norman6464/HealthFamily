import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Hospital } from "@/shared/api";
import type { UpdateHospitalInput } from "@/entities/hospital";

/** 病院を更新し、一覧キャッシュを無効化する。 */
export function useUpdateHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHospitalInput }) =>
      api.patch<Hospital>(`/hospitals/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.hospitals.all });
    },
  });
}
