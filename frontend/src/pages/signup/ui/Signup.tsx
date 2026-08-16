import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { api, ApiError } from "@/shared/api";
import { Button, Card, ErrorText, Input } from "@/shared/ui";
import { GoogleLoginButton } from "@/features/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/signup", { email, password, displayName }, false);
      navigate(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-semibold text-primary">新規登録</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            placeholder="お名前（表示名）"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="パスワード（8文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "登録中..." : "登録して認証コードを送る"}
          </Button>
        </form>
        <GoogleLoginButton onError={setError} />
        <div className="mt-4 text-center text-sm text-ink-500">
          <Link to="/login" className="hover:text-primary">
            ログインへ戻る
          </Link>
        </div>
      </Card>
    </div>
  );
}
