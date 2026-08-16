import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { useInvalidateEmergencyContacts } from "@/entities/emergency-contact";

/** 緊急連絡先を削除する。 */
export function useDeleteEmergencyContact() {
  const invalidate = useInvalidateEmergencyContacts();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/emergency-contacts/${id}`),
    onSuccess: invalidate,
  });
}
