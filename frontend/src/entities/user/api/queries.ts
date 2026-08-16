import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { User } from "@/shared/api";

/** ログイン中ユーザーのプロフィールを取得する。 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: () => api.get<User>("/users/me"),
  });
}
