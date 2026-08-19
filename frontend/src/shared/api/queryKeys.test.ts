import { describe, expect, it } from "vitest";
import { queryKeys } from "./queryKeys";

/** invalidateQueries の前方一致と同じ判定 */
function invalidates(invalidated: readonly unknown[], cached: readonly unknown[]): boolean {
  return invalidated.every((part, i) => Object.is(part, cached[i]));
}

describe("クエリキー", () => {
  // 取得先も応答の型も違うものを同じキーに載せると、React Query は
  // 同一キャッシュとして扱う。先に /members が入ると、一覧が必要とする
  // 件数フィールドが欠けた状態で描画される。実際にそう壊していた。
  describe("メンバー一覧とサマリ", () => {
    it("別のキーになっている", () => {
      expect(queryKeys.members.all).not.toEqual(queryKeys.members.summary);
    });

    it("サマリは members.all の子。メンバー更新の無効化が届く", () => {
      expect(invalidates(queryKeys.members.all, queryKeys.members.summary)).toBe(true);
    });

    it("1人分の取得にも無効化が届く", () => {
      expect(invalidates(queryKeys.members.all, queryKeys.members.detail("m-1"))).toBe(true);
    });
  });

  // 薬の一覧は2系統のキーで持っていた時期があり、片方だけ無効化すると
  // 画面が古いまま残っていた。byMember が all の子であることを固定する。
  describe("薬の一覧", () => {
    it("メンバー別は medications.all の子", () => {
      expect(invalidates(queryKeys.medications.all, queryKeys.medications.byMember("m-1"))).toBe(true);
    });

    it("別メンバーのキャッシュは巻き添えにしない", () => {
      expect(
        invalidates(queryKeys.medications.byMember("m-1"), queryKeys.medications.byMember("m-2")),
      ).toBe(false);
    });
  });

  // メンバーを消すとサーバ側で薬とスケジュールも消える。
  // 別ツリーなので、members の無効化だけでは届かない
  describe("メンバー削除の波及", () => {
    it("薬とスケジュールは members とは別のツリー", () => {
      expect(invalidates(queryKeys.members.all, queryKeys.medications.all)).toBe(false);
      expect(invalidates(queryKeys.members.all, queryKeys.schedules.all)).toBe(false);
    });
  });
});
