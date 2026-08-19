import { useState } from "react";
import { useMember } from "@/entities/member";
import { Link, Navigate, useParams } from "react-router";
import { Pill, Plus, X, ChevronLeft, FileText } from "lucide-react";
import { queryKeys } from "@/shared/api";
import { useResource } from "@/shared/api";
import type { Member, Allergy, Vaccination, Examination, Insurance, Prescription } from "@/shared/api";
import { MemberIcon, type MemberType, type PetType } from "@/shared/ui";
import { LoadingSpinner } from "@/shared/ui";
import { AllergyForm, type AllergyFormData } from "./AllergyForm";
import { AllergyList, type AllergyWithMember, type UpdateAllergyInput } from "./AllergyList";
import { VaccinationForm, type VaccinationFormData } from "./VaccinationForm";
import { VaccinationList, type VaccinationWithMember, type UpdateVaccinationInput } from "./VaccinationList";
import { ExaminationForm, type ExaminationFormData } from "./ExaminationForm";
import { ExaminationList, type ExaminationWithMember, type UpdateExaminationInput } from "./ExaminationList";
import { InsuranceForm, type InsuranceFormData } from "./InsuranceForm";
import { InsuranceList, type InsuranceWithMember, type UpdateInsuranceInput } from "./InsuranceList";
import { PrescriptionForm, type PrescriptionFormData } from "./PrescriptionForm";
import { PrescriptionList, type PrescriptionWithMember, type UpdatePrescriptionInput } from "./PrescriptionList";

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
  const [activeTab, setActiveTab] = useState<TabKey>("allergies");

  const {
    data: member,
    isLoading: memberLoading,
    isError: memberError,
  } = useMember(memberId);

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
        <AllergiesSection member={member} members={members} />
      )}
      {activeTab === "vaccinations" && (
        <VaccinationsSection member={member} members={members} />
      )}
      {activeTab === "examinations" && (
        <ExaminationsSection member={member} members={members} />
      )}
      {activeTab === "insurances" && (
        <InsurancesSection member={member} members={members} />
      )}
      {activeTab === "prescriptions" && (
        <PrescriptionsSection member={member} members={members} />
      )}
    </div>
  );
}

interface SectionProps {
  member: Member;
  members: Member[];
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

function AllergiesSection({ member, members }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const {
    items: allergies,
    isLoading,
    create,
    update,
    remove,
  } = useResource<Allergy, AllergyFormData, UpdateAllergyInput>({
    queryKey: queryKeys.allergies.all,
    listPath: "/allergies",
    basePath: "/allergies",
  });

  const items: AllergyWithMember[] = allergies
    .filter((a) => a.memberId === member.id)
    .map((a) => ({ ...a, memberName: member.name }));

  const handleCreate = async (data: AllergyFormData) => {
    await create.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdateAllergyInput) => {
    await update.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    remove.mutate(id);
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

function VaccinationsSection({ member, members }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const {
    items: vaccinations,
    isLoading,
    create,
    update,
    remove,
  } = useResource<Vaccination, VaccinationFormData, UpdateVaccinationInput>({
    queryKey: queryKeys.vaccinations.all,
    listPath: "/vaccinations",
    basePath: "/vaccinations",
  });

  const items: VaccinationWithMember[] = vaccinations
    .filter((v) => v.memberId === member.id)
    .map((v) => ({ ...v, memberName: member.name }));

  const handleCreate = async (data: VaccinationFormData) => {
    await create.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdateVaccinationInput) => {
    await update.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    remove.mutate(id);
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

function ExaminationsSection({ member, members }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const {
    items: examinations,
    isLoading,
    create,
    update,
    remove,
  } = useResource<Examination, ExaminationFormData, UpdateExaminationInput>({
    queryKey: queryKeys.examinations.all,
    listPath: "/examinations",
    basePath: "/examinations",
  });

  const items: ExaminationWithMember[] = examinations
    .filter((e) => e.memberId === member.id)
    .map((e) => ({ ...e, memberName: member.name }));

  const handleCreate = async (data: ExaminationFormData) => {
    await create.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdateExaminationInput) => {
    await update.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    remove.mutate(id);
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

function InsurancesSection({ member, members }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const {
    items: insurances,
    isLoading,
    create,
    update,
    remove,
  } = useResource<Insurance, InsuranceFormData, UpdateInsuranceInput>({
    queryKey: queryKeys.insurances.all,
    listPath: "/insurances",
    basePath: "/insurances",
  });

  const items: InsuranceWithMember[] = insurances
    .filter((i) => i.memberId === member.id)
    .map((i) => ({ ...i, memberName: member.name }));

  const handleCreate = async (data: InsuranceFormData) => {
    await create.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdateInsuranceInput) => {
    await update.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    remove.mutate(id);
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

function PrescriptionsSection({ member, members }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const {
    items: prescriptions,
    isLoading,
    create,
    update,
    remove,
  } = useResource<Prescription, PrescriptionFormData, UpdatePrescriptionInput>({
    queryKey: queryKeys.prescriptions.all,
    listPath: "/prescriptions",
    basePath: "/prescriptions",
  });

  const items: PrescriptionWithMember[] = prescriptions
    .filter((p) => p.memberId === member.id)
    .map((p) => ({ ...p, memberName: member.name }));

  const handleCreate = async (data: PrescriptionFormData) => {
    await create.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdatePrescriptionInput) => {
    await update.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    remove.mutate(id);
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
