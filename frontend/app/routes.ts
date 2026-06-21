import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("verify", "routes/verify.tsx"),

  // 認証済みレイアウト配下
  layout("routes/_authed.tsx", [
    index("routes/home.tsx"),
    route("members", "routes/members.tsx"),
    route("medications", "routes/medications.tsx"),
  ]),
] satisfies RouteConfig;
