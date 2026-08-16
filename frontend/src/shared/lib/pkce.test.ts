import { describe, expect, it } from "vitest";
import { createCodeChallenge, createRandomString } from "./pkce";

/**
 * PKCE の合言葉まわり。
 *
 * 認可コードを盗まれても、合言葉の本体を知らない攻撃者はトークンを取得できない。
 * ここが弱いと認可コードグラントにした意味が無くなるので、性質を明示的に固定する。
 */
describe("PKCE", () => {
  describe("ランダム文字列", () => {
    it("指定した長さで生成される", () => {
      expect(createRandomString(43)).toHaveLength(43);
      expect(createRandomString(128)).toHaveLength(128);
    });

    it("RFC 7636 が許す文字だけを使う", () => {
      const value = createRandomString(128);

      expect(value).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });

    it("呼ぶたびに異なる値になる", () => {
      const values = new Set(Array.from({ length: 50 }, () => createRandomString(43)));

      expect(values.size).toBe(50);
    });

    it("43文字未満は作れない。短い合言葉は総当たりされうる", () => {
      expect(() => createRandomString(42)).toThrow();
    });

    it("128文字を超える長さは作れない", () => {
      expect(() => createRandomString(129)).toThrow();
    });
  });

  describe("code_challenge", () => {
    it("RFC 7636 の例と一致する", async () => {
      // RFC 7636 Appendix B の検証ベクタ
      const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

      expect(await createCodeChallenge(verifier)).toBe(
        "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
      );
    });

    it("Base64URL なので + / = を含まない", async () => {
      const challenge = await createCodeChallenge(createRandomString(128));

      expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it("同じ合言葉からは同じ値になる", async () => {
      const verifier = createRandomString(64);

      expect(await createCodeChallenge(verifier)).toBe(await createCodeChallenge(verifier));
    });

    it("合言葉が1文字違えば結果は変わる", async () => {
      const a = await createCodeChallenge("a".repeat(43));
      const b = await createCodeChallenge("a".repeat(42) + "b");

      expect(a).not.toBe(b);
    });
  });
});
