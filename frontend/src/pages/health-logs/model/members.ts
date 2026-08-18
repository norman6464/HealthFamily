import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Member } from "@/shared/api";

/**
 * メンバー一覧。記録対象の選択と表示名の解決にのみ使う。
 *
 * メンバーは本来 entities/member の所有物だが、そのスライスはまだ存在しない。
 * 先に作ると members 系画面の移行と衝突するため、暫定的にここへ置いている。
 */
export function useMembersQuery() {
  return useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<Member[]>("/members"),
  });
}
