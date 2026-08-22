import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import config from "../../../tailwind.config";

/**
 * Tailwind の content が実際のソース配置を覆っているか。
 *
 * ここがずれると、ビルドは成功したままユーティリティが1つも生成されず、
 * 画面だけが素の HTML になる。文字や URL しか見ない E2E は素通りするため、
 * 誰も気づかないまま本番に出た。実際にそうなっていた。
 */
describe("Tailwind の content 設定", () => {
  const patterns = (config.content as string[]) ?? [];

  it("src 配下を対象にしている", () => {
    expect(patterns.some((p) => p.includes("src/"))).toBe(true);
  });

  it("FSD の全レイヤーが対象に含まれる", async () => {
    const layers = await readdir(join(process.cwd(), "src"), { withFileTypes: true });
    const dirs = layers.filter((d) => d.isDirectory()).map((d) => d.name);

    // src/**  の形なら全レイヤーを覆う。レイヤーを個別列挙している場合は
    // 実在するレイヤーが漏れていないことを確かめる
    const coversAll = patterns.some((p) => /\.\/src\/\*\*/.test(p));
    if (coversAll) {
      expect(dirs.length).toBeGreaterThan(0);
      return;
    }
    for (const d of dirs) {
      expect(patterns.some((p) => p.includes(`src/${d}`)), `${d} が content に無い`).toBe(true);
    }
  });

  it("実在しないディレクトリだけを指していない", () => {
    // 「./app/**」のようにルート直下を指すと、src 配下の全ファイルが漏れる
    const rootOnly = patterns.every((p) => !p.includes("src/") && !p.endsWith(".html"));
    expect(rootOnly).toBe(false);
  });
});

/**
 * ビルド成果物にユーティリティが載っているか。
 *
 * content の設定が正しくても、取り込み漏れがあれば同じ症状になる。
 * ビルド済みの CSS を直接見て確かめる。build がまだならスキップする。
 */
describe("ビルド済みCSS", () => {
  const assetsDir = join(process.cwd(), "build/client/assets");

  it("主要なユーティリティが生成されている", async () => {
    let files: string[];
    try {
      files = await readdir(assetsDir);
    } catch {
      return; // 未ビルド。CI では build 後に走る
    }
    const cssFile = files.find((f) => f.endsWith(".css"));
    if (!cssFile) return;

    const css = readFileSync(join(assetsDir, cssFile), "utf8");
    // 素の @tailwind base だけだと数KBにしかならない
    expect(css.length, "CSS が小さすぎる。ユーティリティが生成されていない").toBeGreaterThan(20_000);
    for (const cls of ["flex", "rounded", "bg-primary", "text-ink"]) {
      expect(css.includes(cls), `${cls} が生成されていない`).toBe(true);
    }
  });
});
