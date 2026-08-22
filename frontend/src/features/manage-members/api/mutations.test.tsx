import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/test/queryWrapper";
import { queryKeys } from "@/shared/api";
import { useCreateMember, useDeleteMember, useUpdateMember } from "./mutations";

vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>("@/shared/api");
  return {
    ...actual,
    api: {
      post: vi.fn().mockResolvedValue({ id: "m-1" }),
      patch: vi.fn().mockResolvedValue({ id: "m-1" }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
});

/** invalidateQueries の前方一致 */
const covers = (invalidated: unknown[][], key: readonly unknown[]) =>
  invalidated.some((k) => key.every((part, i) => Object.is(part, k[i])));

describe("メンバーの変更操作", () => {
  beforeEach(() => vi.clearAllMocks());

  it("作成すると一覧を取り直す", async () => {
    const { wrapper, invalidated } = createQueryWrapper();
    const { result } = renderHook(() => useCreateMember(), { wrapper });

    result.current.mutate({ name: "太郎", memberType: "human" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(covers(invalidated, queryKeys.members.all)).toBe(true);
  });

  // フォームの開閉は画面ごとに違うので、差し込み口で受ける。
  // 順序も大事で、無効化より先に閉じないと再描画で一瞬フォームが残る
  it("渡した後処理を呼ぶ", async () => {
    const { wrapper } = createQueryWrapper();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCreateMember(onSuccess), { wrapper });

    result.current.mutate({ name: "太郎", memberType: "human" });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("更新でも一覧を取り直す", async () => {
    const { wrapper, invalidated } = createQueryWrapper();
    const { result } = renderHook(() => useUpdateMember(), { wrapper });

    result.current.mutate({ id: "m-1", body: { name: "次郎" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(covers(invalidated, queryKeys.members.all)).toBe(true);
  });

  // メンバーを消すとサーバ側で薬とスケジュールも消える。
  // 取り直さないと、他の画面に消えたはずのデータが残り続ける
  it("削除では薬とスケジュールも取り直す", async () => {
    const { wrapper, invalidated } = createQueryWrapper();
    const { result } = renderHook(() => useDeleteMember(), { wrapper });

    result.current.mutate("m-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(covers(invalidated, queryKeys.members.all)).toBe(true);
    expect(covers(invalidated, queryKeys.medications.all)).toBe(true);
    expect(covers(invalidated, queryKeys.schedules.all)).toBe(true);
  });
});
