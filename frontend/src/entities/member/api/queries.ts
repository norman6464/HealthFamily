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
 * キーは members.all のまま。サーバ集計に切り替えた際も同じキーを使っており、
 * 変えると作成・削除後の無効化が効かなくなる。
 */
export function useMemberSummaries() {
  return useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<MemberWithCounts[]>("/members/summary"),
  });
}
