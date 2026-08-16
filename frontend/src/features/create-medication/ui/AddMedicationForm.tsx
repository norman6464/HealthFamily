import { MedicationForm } from "@/entities/medication";
import { useCreateMedication } from "../api/useCreateMedication";

interface AddMedicationFormProps {
  memberId: string;
  /** 追加が成功したときに、登録した薬の名前を渡す */
  onCreated: (name: string) => void;
  onCancel: () => void;
}

export function AddMedicationForm({ memberId, onCreated, onCancel }: AddMedicationFormProps) {
  const createMedication = useCreateMedication(memberId);

  return (
    <>
      <MedicationForm
        onSubmit={(data) =>
          createMedication.mutate(data, { onSuccess: () => onCreated(data.name) })
        }
        onCancel={onCancel}
      />
      {createMedication.isError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          追加できませんでした: {createMedication.error.message}
        </p>
      )}
    </>
  );
}
