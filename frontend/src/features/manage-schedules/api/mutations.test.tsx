import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/test/queryWrapper";
import { queryKeys } from "@/shared/api";
import { useSetScheduleEnabled } from "./mutations";

const patch = vi.fn().mockResolvedValue({ id: "s-1" });

vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>("@/shared/api");
  return { ...actual, api: { patch: (...a: unknown[]) => patch(...a) } };
});

const covers = (invalidated: unknown[][], key: readonly unknown[]) =>
  invalidated.some((k) => key.every((part, i) => Object.is(part, k[i])));

describe("スケジュールの再開と停止", () => {
  beforeEach(() => vi.clearAllMocks());

  it("再開すると isEnabled を true にして送る", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSetScheduleEnabled(), { wrapper });

    result.current.mutate({ id: "s-1", isEnabled: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patch).toHaveBeenCalledWith("/schedules/s-1", { isEnabled: true });
  });

  it("停止すると isEnabled を false にして送る", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSetScheduleEnabled(), { wrapper });

    result.current.mutate({ id: "s-1", isEnabled: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patch).toHaveBeenCalledWith("/schedules/s-1", { isEnabled: false });
  });

  // 再開したら「今日の予定」にも出るようになる。
  // スケジュールだけ取り直しても、ホームは別のキーで持っているので変わらない
  it("スケジュールと今日の予定の両方を取り直す", async () => {
    const { wrapper, invalidated } = createQueryWrapper();
    const { result } = renderHook(() => useSetScheduleEnabled(), { wrapper });

    result.current.mutate({ id: "s-1", isEnabled: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(covers(invalidated, queryKeys.schedules.all)).toBe(true);
    expect(covers(invalidated, queryKeys.schedules.today)).toBe(true);
  });
});
