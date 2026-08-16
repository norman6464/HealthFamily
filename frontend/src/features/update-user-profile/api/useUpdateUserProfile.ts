import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { User } from "@/shared/api";

/** 表示名などのプロフィールを更新する。 */
export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { displayName: string }) => api.patch<User>("/users/me", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.me }),
  });
}
