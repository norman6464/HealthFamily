import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Member, MemberWithCounts } from "@/shared/api";

/** 家族・ペットのメンバー一覧。 */
export function useMembers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<Member[]>("/members"),
    enabled: options?.enabled,
  });
}

/** 1人分のメンバー。詳細画面とレポートが使う。 */
export function useMember(memberId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members.detail(memberId),
    queryFn: () => api.get<Member>(`/members/${memberId}`),
    enabled: !!memberId,
  });
}

/**
 * メンバーごとの薬の件数を添えた一覧。一覧画面が使う。
 *
 * useMembers とはキーを分ける。取得先も応答の型も違うので、同じキーだと
 * 先に /members の応答がキャッシュされた時に件数フィールドが欠ける。
 * members.all の子なので、メンバー更新時の無効化は今までどおり効く。
 */
export function useMemberSummaries() {
  return useQuery({
    queryKey: queryKeys.members.summary,
    queryFn: () => api.get<MemberWithCounts[]>("/members/summary"),
  });
}
