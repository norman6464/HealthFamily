import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { api, ApiError } from "@/shared/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await api.post("/auth/forgot-password", { email }, false);
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || "送信に失敗しました");
      } else {
        setErrorMessage(
          "通信エラーが発生しました。インターネット接続を確認して再試行してください。",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50/30 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/icon.svg"
            alt="HealthFamily"
            width={80}
            height={80}
            className="mx-auto mb-2 rounded-2xl"
          />
          <h1 className="text-3xl font-bold text-primary-600">HealthFamily</h1>
          <p className="mt-2 text-ink-500">パスワードの再設定</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <p className="text-sm text-ink-600">
            登録済みのメールアドレスを入力してください。リセットコードをお送りします。
          </p>

          {errorMessage && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm" role="alert">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="example@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "送信中..." : "リセットコードを送信"}
          </button>

          <p className="text-center text-sm text-ink-500">
            <Link to="/login" className="text-primary-600 hover:underline">
              ログイン画面に戻る
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
