import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Member } from "@/shared/api";

/**
 * メンバーの作成・更新・削除。
 *
 * 呼び出し側はフォームの開閉や編集対象のリセットを onSuccess で行うため、
 * その差し込み口を引数で受ける。ここで固定してしまうと、
 * 画面ごとに違う後処理を書けなくなる。
 */

export type CreateMemberBody = {
  name: string;
  memberType: string;
  petType?: string | null;
  birthDate?: string | null;
  notes?: string | null;
};

export type UpdateMemberBody = Partial<CreateMemberBody>;

export function useCreateMember(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMemberBody) => api.post<Member>("/members", body),
    onSuccess: () => {
      onSuccess?.();
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}

export function useUpdateMember(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMemberBody }) =>
      api.patch<Member>(`/members/${id}`, body),
    onSuccess: () => {
      onSuccess?.();
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members.all }),
  });
}
