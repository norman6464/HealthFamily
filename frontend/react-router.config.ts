import type { Config } from "@react-router/dev/config";

// SPA モード: Go バックエンド(API)とは独立し、静的アセットとして Render Static Site にデプロイする
export default {
  ssr: false,
} satisfies Config;
