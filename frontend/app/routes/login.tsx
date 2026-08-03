import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { HeartPulse } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 to-[#f8faf9] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
            <HeartPulse className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-ink-800">HealthFamily</h1>
          <p className="mt-1 text-sm text-ink-500">家族とペットの健康をひとつに</p>
        </div>
        <Card className="w-full">
          <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "ログイン中..." : "ログイン"}
          </Button>
          </form>
          <GoogleLoginButton onError={setError} />
          <div className="mt-5 text-center text-sm text-ink-500">
            アカウントをお持ちでない方は{" "}
            <Link to="/signup" className="font-semibold text-primary hover:text-primary-dark">
              新規登録
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
