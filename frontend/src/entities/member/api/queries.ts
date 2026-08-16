import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Member } from "@/shared/api";

/** 家族・ペットのメンバー一覧。 */
export function useMembers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<Member[]>("/members"),
    enabled: options?.enabled,
  });
}
