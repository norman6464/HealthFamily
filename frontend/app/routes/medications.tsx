import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/lib/api";
import type { Member } from "@/lib/types";
import { CategoryFilter, type MedicationCategory } from "@/components/shared/CategoryFilter";
import { MemberMedications } from "@/components/medications/MemberMedications";

export default function Medications() {
  const [selectedCategory, setSelectedCategory] = useState<MedicationCategory | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.get<Member[]>("/members"),
  });

  const hasMembers = useMemo(() => members.length > 0, [members]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-800 tracking-wide">お薬</h1>
      </div>

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
