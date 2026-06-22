import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // 公開ルート
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("verify", "routes/verify.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),

  // 認証済みレイアウト配下
  layout("routes/_authed.tsx", [
    index("routes/home.tsx"),
    route("members", "routes/members.tsx"),
    route("members/:memberId", "routes/members.$memberId.tsx"),
    route(
      "members/:memberId/medications",
      "routes/members.$memberId.medications.tsx",
    ),
    route("medications", "routes/medications.tsx"),
    route("appointments", "routes/appointments.tsx"),
    route("hospitals", "routes/hospitals.tsx"),
    route("health-logs", "routes/health-logs.tsx"),
    route("history", "routes/history.tsx"),
    route("settings", "routes/settings.tsx"),
    route("settings/notifications", "routes/settings.notifications.tsx"),
    route("guide", "routes/guide.tsx"),
  ]),
] satisfies RouteConfig;
