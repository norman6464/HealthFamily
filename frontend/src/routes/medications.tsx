import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Medication, Member } from "@/lib/types";
import { CategoryFilter, type MedicationCategory } from "@/components/shared/CategoryFilter";
import { MemberMedications } from "@/components/medications/MemberMedications";
import { InteractionWarning } from "@/components/medications/InteractionWarning";
import { checkInteractions } from "@/lib/interactions";

export default function Medications() {
  const [selectedCategory, setSelectedCategory] = useState<MedicationCategory | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<Member[]>("/members"),
  });

  const { data: allMedications = [] } = useQuery({
    queryKey: queryKeys.medications.all,
    queryFn: () => api.get<Medication[]>("/medications"),
  });

  const hasMembers = useMemo(() => members.length > 0, [members]);

  const interactionWarnings = useMemo(
    () =>
      checkInteractions(
        allMedications.filter((m) => m.isActive).map((m) => ({ name: m.name })),
      ),
    [allMedications],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-800 tracking-wide">お薬</h1>
      </div>

      {!isLoading && hasMembers && (
        <InteractionWarning warnings={interactionWarnings} />
      )}

      {!isLoading && hasMembers && (
        <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <p className="text-ink-500">読み込み中...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-12">
          <p className="text-ink-500 text-lg mb-4">メンバーがまだ登録されていません</p>
          <Link to="/members" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            メンバーを追加する
          </Link>
        </div>
      ) : (
        members.map((member) => (
          <MemberMedications key={member.id} member={member} categoryFilter={selectedCategory} />
        ))
      )}
    </div>
  );
}
