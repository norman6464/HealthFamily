import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Hospital } from "@/lib/types";
import { HospitalList, type UpdateHospitalInput } from "@/components/hospitals/HospitalList";
import { HospitalForm, type HospitalFormData } from "@/components/hospitals/HospitalForm";

export default function Hospitals() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: queryKeys.hospitals.all,
    queryFn: () => api.get<Hospital[]>("/hospitals"),
  });

  const createMutation = useMutation({
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
      setShowForm(false);
      qc.invalidateQueries({ queryKey: queryKeys.hospitals.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHospitalInput }) =>
      api.patch<Hospital>(`/hospitals/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.hospitals.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/hospitals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.hospitals.all }),
  });

  const handleCreate = (data: HospitalFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = async (hospitalId: string, input: UpdateHospitalInput) => {
    await updateMutation.mutateAsync({ id: hospitalId, input });
  };

  const handleDelete = (hospitalId: string) => {
    deleteMutation.mutate(hospitalId);
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
