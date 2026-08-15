import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * FSD の境界検査。
 *
 * 層の上下は app > pages > widgets > features > entities > shared。
 * 各層から「自分と同じか上の層」への import を禁止する。
 *
 * 移行中のため severity は warn。旧構成 (components / hooks / lib / routes / stores) は
 * 移行元なので対象外にしてある。すべて移し終えたら error へ昇格し、旧構成の除外も外す。
 */

const LEGACY = [
  "src/components/**",
  "src/hooks/**",
  "src/lib/**",
  "src/routes/**",
  "src/stores/**",
];

const TESTS = ["**/*.test.ts", "**/*.test.tsx", "e2e/**"];

/** 「自分と同じか上の層」への import を禁止するルールを組み立てる */
function forbidUpward(groups, extra = []) {
  return {
    "no-restricted-imports": [
      "warn",
      {
        patterns: [
          {
            group: groups,
            message:
              "上位層および同一層の別スライスは参照できません。共通化したいものは下の層へ降ろすか、上の層で組み合わせてください。",
          },
          ...extra,
        ],
      },
    ],
  };
}

export default tseslint.config(
  {
    ignores: ["build/**", ".react-router/**", "node_modules/**", "public/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // 既存コードに disable コメントが点在しているため、まずは warn で可視化する
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // --- FSD 境界検査 -------------------------------------------------------
  // app 層は最上位なので上方向の禁止はない。root.tsx / routes.ts もここに含まれる。

  {
    files: ["src/pages/**"],
    ignores: TESTS,
    rules: forbidUpward(["@/app/*", "@/pages/*"]),
  },
  {
    files: ["src/widgets/**"],
    ignores: TESTS,
    rules: forbidUpward(["@/app/*", "@/pages/*", "@/widgets/*"]),
  },
  {
    files: ["src/features/**"],
    ignores: TESTS,
    rules: forbidUpward(["@/app/*", "@/pages/*", "@/widgets/*", "@/features/*"]),
  },
  {
    files: ["src/entities/**"],
    ignores: TESTS,
    rules: forbidUpward(
      ["@/app/*", "@/pages/*", "@/widgets/*", "@/features/*"],
      [
        {
          // entities 同士は原則禁止。公式の @x 記法だけ例外的に許可する
          regex: "^@/entities/(?!(\\w|-)+/@x/)",
          message:
            "entities 同士は @x の Public API 経由でのみ参照できます (例: @/entities/member/@x/medication)。",
        },
      ],
    ),
  },
  {
    files: ["src/shared/**"],
    ignores: TESTS,
    rules: forbidUpward([
      "@/app/*",
      "@/pages/*",
      "@/widgets/*",
      "@/features/*",
      "@/entities/*",
    ]),
  },

  // --- 移行中の旧構成 -----------------------------------------------------
  // 移行元なので境界検査の対象外。移行完了時にこのブロックごと削除する。
  {
    files: LEGACY,
    rules: { "no-restricted-imports": "off" },
  },

  // --- テスト -------------------------------------------------------------
  // 上位層の Provider でラップするのは正当なので境界検査から外す。
  {
    files: TESTS,
    rules: { "no-restricted-imports": "off" },
  },
);
