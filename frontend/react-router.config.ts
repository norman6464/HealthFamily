import type { Config } from "@react-router/dev/config";

// SPA モード: Go バックエンド(API)とは独立し、静的アセットとして Vercel にデプロイする。
// appDirectory を src にしているのは FSD の層を src 直下に並べるため
// (src/pages, src/widgets, src/features, src/entities, src/shared)。
// React Router が要求する root.tsx と routes.ts は src 直下に置く必要があり、
// これらは FSD 上は app 層に属する。
export default {
  ssr: false,
  appDirectory: "src",
} satisfies Config;
