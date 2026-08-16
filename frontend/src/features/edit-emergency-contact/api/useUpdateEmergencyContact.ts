import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { EmergencyContact } from "@/shared/api";
import {
  useInvalidateEmergencyContacts,
  type UpdateEmergencyContactInput,
} from "@/entities/emergency-contact";

/** 緊急連絡先を更新する。 */
export function useUpdateEmergencyContact() {
  const invalidate = useInvalidateEmergencyContacts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmergencyContactInput }) =>
      api.patch<EmergencyContact>(`/emergency-contacts/${id}`, input),
    onSuccess: invalidate,
  });
}
