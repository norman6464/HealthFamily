import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// ルート定義は app 層の責務。参照先は pages スライスの Public API に固定し、
// スライス内部の構成には依存しない。
export default [
  // 公開ルート
  route("login", "pages/login/index.ts"),
  route("signup", "pages/signup/index.ts"),
  route("verify", "pages/verify/index.ts"),
  route("forgot-password", "pages/forgot-password/index.ts"),
  route("reset-password", "pages/reset-password/index.ts"),

  // 医師共有用の印刷最適化レポート（サイドバー等を出さない独立ページ）
  // 認証済みレイアウトの外にあるため、画面側で個別に useRequireAuth を呼んでいる
  route("members/:memberId/report", "pages/member-report/index.ts"),

  // 認証済みレイアウト配下
  layout("app/AuthedLayout.tsx", [
    index("pages/home/index.ts"),
    route("members", "pages/members/index.ts"),
    route("members/:memberId", "pages/member-detail/index.ts"),
    route("members/:memberId/medications", "pages/member-medications/index.ts"),
    route("medications", "pages/medications/index.ts"),
    route("appointments", "pages/appointments/index.ts"),
    route("hospitals", "pages/hospitals/index.ts"),
    route("health-logs", "pages/health-logs/index.ts"),
    route("expenses", "pages/expenses/index.ts"),
    route("history", "pages/history/index.ts"),
    route("settings", "pages/settings/index.ts"),
    route("settings/notifications", "pages/settings-notifications/index.ts"),
    route("guide", "pages/guide/index.ts"),
  ]),
] satisfies RouteConfig;
