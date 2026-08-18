import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Medication } from "@/shared/api";

/** ユーザーの全メンバー分の薬一覧。 */
export function useMedications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.medications.all,
    queryFn: () => api.get<Medication[]>("/medications"),
    enabled: options?.enabled,
  });
}

/** 指定メンバーの薬一覧。 */
export function useMemberMedications(memberId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.medications.byMember(memberId ?? ""),
    queryFn: () => api.get<Medication[]>(`/members/${memberId}/medications`),
    // memberId は useParams 由来で undefined になりうる。
    // 未確定のまま /members/undefined/medications を叩かせない
    enabled: !!memberId,
  });
}

/**
 * キャッシュを介さない単発取得。
 * フォームの選択肢のように、開いたタイミングの内容だけが必要な場面で使う。
 */
export function fetchMemberMedications(memberId: string) {
  return api.get<Medication[]>(`/members/${memberId}/medications`);
}
