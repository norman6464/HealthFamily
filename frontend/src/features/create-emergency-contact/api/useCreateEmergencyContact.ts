import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { EmergencyContact } from "@/shared/api";
import {
  useInvalidateEmergencyContacts,
  type EmergencyContactFormData,
} from "@/entities/emergency-contact";

/** 緊急連絡先を登録する。 */
export function useCreateEmergencyContact() {
  const invalidate = useInvalidateEmergencyContacts();
  return useMutation({
    mutationFn: (data: EmergencyContactFormData) =>
      api.post<EmergencyContact>("/emergency-contacts", data),
    onSuccess: invalidate,
  });
}
