import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ApiError } from "@/shared/api";
import { resendVerificationCode, useAuth, verifyEmail } from "@/features/auth";
import { Button, Card, ErrorText, Input } from "@/shared/ui";

export default function Verify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await verifyEmail({ email, code });
      loginWithToken(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "認証に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await resendVerificationCode(email);
    } catch {
      /* 列挙防止のため成否は表示しない */
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-xl font-semibold text-primary">メール認証</h1>
        <p className="mb-6 text-center text-sm text-ink-500">
          メールに届いた6桁のコードを入力してください
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            placeholder="認証コード"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
          />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "認証中..." : "認証する"}
          </Button>
        </form>
        <button onClick={resend} className="mt-4 w-full text-center text-sm text-ink-500 hover:text-primary">
          コードを再送する
        </button>
      </Card>
    </div>
  );
}
