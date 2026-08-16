// features/auth の Public API。
// 認証状態の参照と認可ガードは必ずここを通す。内部実装を直接触らせない。
export { AuthProvider, useAuth, useRequireAuth } from "./model/auth";
export { GoogleLoginButton, GOOGLE_CALLBACK_PATH } from "./ui/GoogleLoginButton";
export { buildAuthorizationRequest, consumeAuthorizationState } from "./model/googleOauth";
