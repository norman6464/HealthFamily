import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router";
import { Pill, Plus, X, ChevronLeft, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  Member,
  Allergy,
  Vaccination,
  Examination,
  Insurance,
  Prescription,
} from "@/lib/types";
import { MemberIcon, type MemberType, type PetType } from "@/components/shared/MemberIcon";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AllergyForm, type AllergyFormData } from "@/components/allergies/AllergyForm";
import {
  AllergyList,
  type AllergyWithMember,
  type UpdateAllergyInput,
} from "@/components/allergies/AllergyList";
import {
  VaccinationForm,
  type VaccinationFormData,
} from "@/components/vaccinations/VaccinationForm";
import {
  VaccinationList,
  type VaccinationWithMember,
  type UpdateVaccinationInput,
} from "@/components/vaccinations/VaccinationList";
import {
  ExaminationForm,
  type ExaminationFormData,
} from "@/components/examinations/ExaminationForm";
import {
  ExaminationList,
  type ExaminationWithMember,
  type UpdateExaminationInput,
} from "@/components/examinations/ExaminationList";
import { InsuranceForm, type InsuranceFormData } from "@/components/insurances/InsuranceForm";
import {
  InsuranceList,
  type InsuranceWithMember,
  type UpdateInsuranceInput,
} from "@/components/insurances/InsuranceList";
import {
  PrescriptionForm,
  type PrescriptionFormData,
} from "@/components/prescriptions/PrescriptionForm";
import {
  PrescriptionList,
  type PrescriptionWithMember,
  type UpdatePrescriptionInput,
} from "@/components/prescriptions/PrescriptionList";

type TabKey = "allergies" | "vaccinations" | "examinations" | "insurances" | "prescriptions";

const TABS: { key: TabKey; label: string }[] = [
  { key: "allergies", label: "アレルギー" },
  { key: "vaccinations", label: "予防接種" },
  { key: "examinations", label: "検査" },
  { key: "insurances", label: "保険" },
  { key: "prescriptions", label: "処方箋" },
];

const memberTypeLabels: Record<string, string> = {
  human: "家族",
  pet: "ペット",
};

export default function MemberDetail() {
  const { memberId } = useParams();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("allergies");

  const {
    data: member,
    isLoading: memberLoading,
    isError: memberError,
  } = useQuery({
    queryKey: queryKeys.members.detail(memberId),
    queryFn: () => api.get<Member>(`/members/${memberId}`),
    enabled: !!memberId,
    retry: false,
  });

  if (memberLoading) {
    return <LoadingSpinner />;
  }

  if (memberError || !member) {
    return <Navigate to="/members" replace />;
  }

  const members: Member[] = [member];
  const typeLabel = memberTypeLabels[member.memberType] ?? member.memberType;

  return (
    <div className="space-y-4">
      <Link
        to="/members"
        className="inline-flex items-center space-x-1 text-sm text-ink-500 hover:text-ink-700 transition-colors"
      >
        <ChevronLeft size={16} />
        <span>メンバー一覧</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-soft p-4 border border-primary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MemberIcon
              memberType={member.memberType as MemberType}
              petType={(member.petType ?? undefined) as PetType | undefined}
              size={32}
              className="text-ink-600"
            />
            <div>
              <p className="text-lg font-bold text-ink-800">{member.name}</p>
              <p className="text-sm text-ink-500">{typeLabel}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to={`/members/${member.id}/report`}
              className="flex items-center space-x-1 px-3 py-1.5 bg-primary-50 text-primary text-sm rounded-xl hover:bg-primary-100 transition-colors"
            >
              <FileText size={16} />
              <span>医師共有用サマリー</span>
            </Link>
            <Link
              to={`/members/${member.id}/medications`}
              className="flex items-center space-x-1 px-3 py-1.5 bg-primary text-white text-sm rounded-xl hover:bg-primary-dark transition-colors"
            >
              <Pill size={16} />
              <span>お薬管理</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              activeTab === tab.key
                ? "bg-primary-50 text-primary"
                : "text-ink-500 hover:bg-primary-50/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "allergies" && (
        <AllergiesSection member={member} members={members} qc={qc} />
      )}
      {activeTab === "vaccinations" && (
        <VaccinationsSection member={member} members={members} qc={qc} />
      )}
      {activeTab === "examinations" && (
        <ExaminationsSection member={member} members={members} qc={qc} />
      )}
      {activeTab === "insurances" && (
        <InsurancesSection member={member} members={members} qc={qc} />
      )}
      {activeTab === "prescriptions" && (
        <PrescriptionsSection member={member} members={members} qc={qc} />
      )}
    </div>
  );
}

type QueryClientType = ReturnType<typeof useQueryClient>;

interface SectionProps {
  member: Member;
  members: Member[];
  qc: QueryClientType;
}

function SectionHeader({
  title,
  showForm,
  onToggle,
}: {
  title: string;
  showForm: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-ink-800">{title}</h2>
      <button
        onClick={onToggle}
        className="bg-primary text-white p-1.5 rounded-full hover:bg-primary-dark transition-colors"
        aria-label={showForm ? "閉じる" : "追加"}
      >
        {showForm ? <X size={16} /> : <Plus size={16} />}
      </button>
    </div>
  );
}

function FormWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 bg-white rounded-2xl shadow-sm p-4 border border-primary-100">
      {children}
    </div>
  );
}

function AllergiesSection({ member, members, qc }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const { data: allergies = [], isLoading } = useQuery({
    queryKey: queryKeys.allergies.all,
    queryFn: () => api.get<Allergy[]>("/allergies"),
  });

  const createMutation = useMutation({
    mutationFn: (data: AllergyFormData) => api.post<Allergy>("/allergies", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.allergies.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAllergyInput }) =>
      api.patch<Allergy>(`/allergies/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.allergies.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/allergies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.allergies.all }),
  });

  const items: AllergyWithMember[] = allergies
    .filter((a) => a.memberId === member.id)
    .map((a) => ({ ...a, memberName: member.name }));

  const handleCreate = async (data: AllergyFormData) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdateAllergyInput) => {
    await updateMutation.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <section>
      <SectionHeader title="アレルギー" showForm={showForm} onToggle={() => setShowForm((v) => !v)} />
      {showForm && (
        <FormWrapper>
          <AllergyForm members={members} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </FormWrapper>
      )}
      <AllergyList allergies={items} isLoading={isLoading} onUpdate={handleUpdate} onDelete={handleDelete} />
    </section>
  );
}

function VaccinationsSection({ member, members, qc }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const { data: vaccinations = [], isLoading } = useQuery({
    queryKey: queryKeys.vaccinations.all,
    queryFn: () => api.get<Vaccination[]>("/vaccinations"),
  });

  const createMutation = useMutation({
    mutationFn: (data: VaccinationFormData) => api.post<Vaccination>("/vaccinations", data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.vaccinations.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVaccinationInput }) =>
      api.patch<Vaccination>(`/vaccinations/${id}`, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.vaccinations.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vaccinations/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.vaccinations.all }),
  });

  const items: VaccinationWithMember[] = vaccinations
    .filter((v) => v.memberId === member.id)
    .map((v) => ({ ...v, memberName: member.name }));

  const handleCreate = async (data: VaccinationFormData) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdateVaccinationInput) => {
    await updateMutation.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <section>
      <SectionHeader title="予防接種" showForm={showForm} onToggle={() => setShowForm((v) => !v)} />
      {showForm && (
        <FormWrapper>
          <VaccinationForm members={members} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </FormWrapper>
      )}
      <VaccinationList
        vaccinations={items}
        isLoading={isLoading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </section>
  );
}

function ExaminationsSection({ member, members, qc }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const { data: examinations = [], isLoading } = useQuery({
    queryKey: queryKeys.examinations.all,
    queryFn: () => api.get<Examination[]>("/examinations"),
  });

  const createMutation = useMutation({
    mutationFn: (data: ExaminationFormData) => api.post<Examination>("/examinations", data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.examinations.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExaminationInput }) =>
      api.patch<Examination>(`/examinations/${id}`, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.examinations.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/examinations/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.examinations.all }),
  });

  const items: ExaminationWithMember[] = examinations
    .filter((e) => e.memberId === member.id)
    .map((e) => ({ ...e, memberName: member.name }));

  const handleCreate = async (data: ExaminationFormData) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdateExaminationInput) => {
    await updateMutation.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <section>
      <SectionHeader title="検査" showForm={showForm} onToggle={() => setShowForm((v) => !v)} />
      {showForm && (
        <FormWrapper>
          <ExaminationForm members={members} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </FormWrapper>
      )}
      <ExaminationList
        examinations={items}
        isLoading={isLoading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </section>
  );
}

function InsurancesSection({ member, members, qc }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const { data: insurances = [], isLoading } = useQuery({
    queryKey: queryKeys.insurances.all,
    queryFn: () => api.get<Insurance[]>("/insurances"),
  });

  const createMutation = useMutation({
    mutationFn: (data: InsuranceFormData) => api.post<Insurance>("/insurances", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.insurances.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInsuranceInput }) =>
      api.patch<Insurance>(`/insurances/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.insurances.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/insurances/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.insurances.all }),
  });

  const items: InsuranceWithMember[] = insurances
    .filter((i) => i.memberId === member.id)
    .map((i) => ({ ...i, memberName: member.name }));

  const handleCreate = async (data: InsuranceFormData) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdateInsuranceInput) => {
    await updateMutation.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <section>
      <SectionHeader title="保険" showForm={showForm} onToggle={() => setShowForm((v) => !v)} />
      {showForm && (
        <FormWrapper>
          <InsuranceForm members={members} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </FormWrapper>
      )}
      <InsuranceList
        insurances={items}
        isLoading={isLoading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </section>
  );
}

function PrescriptionsSection({ member, members, qc }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: queryKeys.prescriptions.all,
    queryFn: () => api.get<Prescription[]>("/prescriptions"),
  });

  const createMutation = useMutation({
    mutationFn: (data: PrescriptionFormData) => api.post<Prescription>("/prescriptions", data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePrescriptionInput }) =>
      api.patch<Prescription>(`/prescriptions/${id}`, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/prescriptions/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.all }),
  });

  const items: PrescriptionWithMember[] = prescriptions
    .filter((p) => p.memberId === member.id)
    .map((p) => ({ ...p, memberName: member.name }));

  const handleCreate = async (data: PrescriptionFormData) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdatePrescriptionInput) => {
    await updateMutation.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <section>
      <SectionHeader title="処方箋" showForm={showForm} onToggle={() => setShowForm((v) => !v)} />
      {showForm && (
        <FormWrapper>
          <PrescriptionForm members={members} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </FormWrapper>
      )}
      <PrescriptionList
        prescriptions={items}
        isLoading={isLoading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </section>
  );
}
