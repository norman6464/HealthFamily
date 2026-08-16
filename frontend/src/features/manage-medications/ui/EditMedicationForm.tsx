import type { Medication } from "@/shared/api";
import { MedicationForm } from "@/entities/medication";
import { useUpdateMedication } from "../api/useUpdateMedication";

interface EditMedicationFormProps {
  memberId: string;
  medication: Medication;
  onUpdated: () => void;
  onCancel: () => void;
}

export function EditMedicationForm({
  memberId,
  medication,
  onUpdated,
  onCancel,
}: EditMedicationFormProps) {
  const updateMedication = useUpdateMedication(memberId);

  return (
    <>
      <MedicationForm
        onSubmit={(data) =>
          updateMedication.mutate({ id: medication.id, data }, { onSuccess: onUpdated })
        }
        initialData={medication}
        onCancel={onCancel}
      />
      {updateMedication.isError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          更新できませんでした: {updateMedication.error.message}
        </p>
      )}
    </>
  );
}
