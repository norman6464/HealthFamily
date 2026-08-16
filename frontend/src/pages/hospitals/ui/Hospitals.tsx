import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, X } from "lucide-react";
import { HospitalList, useHospitals, type UpdateHospitalInput } from "@/entities/hospital";
import { HospitalForm, useCreateHospital, type HospitalFormData } from "@/features/create-hospital";
import { useUpdateHospital } from "@/features/update-hospital";
import { useDeleteHospital } from "@/features/delete-hospital";

export default function Hospitals() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const { data: hospitals = [], isLoading } = useHospitals();
  const create = useCreateHospital();
  const update = useUpdateHospital();
  const remove = useDeleteHospital();

  const handleCreate = (data: HospitalFormData) => {
    create.mutate(data, { onSuccess: () => setShowForm(false) });
  };

  const handleUpdate = async (hospitalId: string, input: UpdateHospitalInput) => {
    await update.mutateAsync({ id: hospitalId, input });
  };

  const handleDelete = (hospitalId: string) => {
    remove.mutate(hospitalId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/appointments")}
            className="text-ink-600 hover:text-ink-800 transition-colors"
            aria-label="通院管理に戻る"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-ink-800 tracking-wide">かかりつけ医(病院)</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
          aria-label={showForm ? "閉じる" : "病院を追加"}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-primary-100">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">病院の追加</h2>
          <HospitalForm onSubmit={handleCreate} />
        </div>
      )}

      <HospitalList
        hospitals={hospitals}
        isLoading={isLoading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
