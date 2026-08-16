import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthorizationRequest,
  consumeAuthorizationState,
  GOOGLE_AUTHORIZE_ENDPOINT,
} from "./googleOauth";

/**
 * 認可リクエストの組み立てと、コールバックでの検証。
 *
 * ここが甘いと、認可コードグラントにしても CSRF や合言葉の使い回しで突破される。
 * 「1度きり」「state 一致」を明示的に固定する。
 */
describe("Google 認可リクエスト", () => {
  const CLIENT_ID = "test-client.apps.googleusercontent.com";
  // location をスタブすると jsdom のストレージが壊れるので、実オリジンから組み立てる
  const REDIRECT_URI = `${location.origin}/auth/callback`;

  // Node 25 のネイティブ localStorage が jsdom のものを覆うため、
  // 「localStorage に書かない」ことは呼び出しの有無で検証する
  const localSetItem = vi.fn();

  beforeEach(() => {
    window.sessionStorage.clear();
    localSetItem.mockClear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: { setItem: localSetItem, getItem: vi.fn(), removeItem: vi.fn(), length: 0 },
    });
  });

  describe("認可 URL の組み立て", () => {
    it("認可コードグラントとして必要なパラメータが揃う", async () => {
      const { url } = await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);
      const params = new URL(url).searchParams;

      expect(url.startsWith(GOOGLE_AUTHORIZE_ENDPOINT)).toBe(true);
      expect(params.get("response_type")).toBe("code");
      expect(params.get("client_id")).toBe(CLIENT_ID);
      expect(params.get("redirect_uri")).toBe(REDIRECT_URI);
      expect(params.get("scope")).toBe("openid email profile");
    });

    it("PKCE は常に S256。plain は使わない", async () => {
      const { url } = await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);
      const params = new URL(url).searchParams;

      expect(params.get("code_challenge_method")).toBe("S256");
      expect(params.get("code_challenge")).toMatch(/^[A-Za-z0-9\-_]{43}$/);
    });

    it("state と nonce が付く", async () => {
      const { url } = await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);
      const params = new URL(url).searchParams;

      expect(params.get("state")).toBeTruthy();
      expect(params.get("nonce")).toBeTruthy();
      expect(params.get("state")).not.toBe(params.get("nonce"));
    });

    it("code_verifier は URL に出さない。ハッシュだけを預ける", async () => {
      const { url } = await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);

      expect(url).not.toContain("code_verifier");
    });

    it("呼ぶたびに state と合言葉が変わる", async () => {
      const a = await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);
      const b = await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);

      expect(new URL(a.url).searchParams.get("state")).not.toBe(
        new URL(b.url).searchParams.get("state"),
      );
    });

    it("合言葉は sessionStorage に置く。localStorage には残さない", async () => {
      await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);

      expect(window.sessionStorage.length).toBeGreaterThan(0);
      expect(localSetItem).not.toHaveBeenCalled();
    });
  });

  describe("コールバックでの検証", () => {
    it("state が一致すれば合言葉を取り出せる", async () => {
      const { state } = await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);

      const consumed = consumeAuthorizationState(state);

      expect(consumed.codeVerifier).toMatch(/^[A-Za-z0-9\-._~]{128}$/);
      expect(consumed.redirectUri).toBe(REDIRECT_URI);
    });

    it("state が違えば拒否する。CSRF を通さない", async () => {
      await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);

      expect(() => consumeAuthorizationState("attacker-state")).toThrow(/state/);
    });

    it("一度使った合言葉は再利用できない", async () => {
      const { state } = await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);

      consumeAuthorizationState(state);

      expect(() => consumeAuthorizationState(state)).toThrow();
    });

    it("取り出したあと sessionStorage に痕跡が残らない", async () => {
      const { state } = await buildAuthorizationRequest(CLIENT_ID, REDIRECT_URI);

      consumeAuthorizationState(state);

      expect(window.sessionStorage.length).toBe(0);
    });

    it("開始していない状態でのコールバックは拒否する", () => {
      expect(() => consumeAuthorizationState("whatever")).toThrow();
    });
  });

  describe("リダイレクト先の検証", () => {
    it("同一オリジンでない redirect_uri は組み立てない", async () => {
      await expect(
        buildAuthorizationRequest(CLIENT_ID, "https://evil.example/steal"),
      ).rejects.toThrow(/リダイレクト/);
    });
  });
});
