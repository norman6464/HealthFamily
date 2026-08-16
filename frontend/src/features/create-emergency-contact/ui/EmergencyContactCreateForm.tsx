import React from "react";
import type { Member } from "@/shared/api";
import {
  EmergencyContactForm,
  type EmergencyContactFormData,
} from "@/entities/emergency-contact";
import { useCreateEmergencyContact } from "../api/useCreateEmergencyContact";

interface EmergencyContactCreateFormProps {
  members: Member[];
  onCreated: () => void;
  onCancel: () => void;
}

export const EmergencyContactCreateForm: React.FC<EmergencyContactCreateFormProps> = ({
  members,
  onCreated,
  onCancel,
}) => {
  const createMutation = useCreateEmergencyContact();

  const handleSubmit = async (data: EmergencyContactFormData) => {
    await createMutation.mutateAsync(data);
    onCreated();
  };

  return (
    <EmergencyContactForm members={members} onSubmit={handleSubmit} onCancel={onCancel} />
  );
};
