import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";

/**
 * 汎用CRUDリソースフック。
 *
 * 各画面に散在していた「一覧取得(useQuery) + create/update/delete(useMutation) +
 * 成功時の invalidateQueries」というボイラープレートを一箇所に集約する。
 *
 * 重要:
 * - queryKey は呼び出し側で既存と「バイト等価」の配列を渡すこと
 *   (queryKeys ファクトリの .all 等をそのまま渡す)。
 * - listPath / basePath は既存のエンドポイントと厳密一致させること。
 *   作成は POST basePath、更新は PATCH `${basePath}/${id}`、削除は DELETE `${basePath}/${id}`。
 * - invalidate は一覧キーの invalidateQueries を行う。React Query のプレフィックス一致に
 *   依存しているため、既存挙動と同じキーを渡す限り無効化範囲も同一になる。
 */
export interface ResourceConfig {
  /** 一覧のクエリキー(既存と同一配列を渡す) */
  queryKey: readonly unknown[];
  /** 一覧取得パス。例 "/hospitals" */
  listPath: string;
  /** 作成 POST basePath、更新/削除は `${basePath}/${id}`。例 "/hospitals" */
  basePath: string;
  /** 追加で無効化するキー(任意) */
  invalidateKeys?: readonly (readonly unknown[])[];
}

export function useResource<T, C = unknown, U = unknown>(cfg: ResourceConfig) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: cfg.queryKey,
    queryFn: () => api.get<T[]>(cfg.listPath),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: cfg.queryKey });
    cfg.invalidateKeys?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  };

  const create = useMutation({
    mutationFn: (body: C) => api.post<T>(cfg.basePath, body),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: U }) =>
      api.patch<T>(`${cfg.basePath}/${id}`, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`${cfg.basePath}/${id}`),
    onSuccess: invalidate,
  });

  return {
    list,
    items: list.data ?? [],
    isLoading: list.isLoading,
    create,
    update,
    remove,
    invalidate,
  };
}
