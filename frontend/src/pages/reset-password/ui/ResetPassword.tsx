import { useState, useEffect } from "react";
import { resetPassword } from "@/features/auth";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { ApiError } from "@/shared/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const [email] = useState(emailParam);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!emailParam) {
      navigate("/forgot-password", { replace: true });
    }
  }, [emailParam, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("パスワードが一致しません");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("パスワードは8文字以上で入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ email, code, newPassword });
      setSuccessMessage("パスワードを再設定しました。ログイン画面に移動します。");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || "再設定に失敗しました");
      } else {
        setErrorMessage("再設定に失敗しました");
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
          <p className="mt-2 text-ink-500">新しいパスワードの設定</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <p className="text-sm text-ink-600">
            <strong>{email}</strong> に送信された6桁のリセットコードと新しいパスワードを入力してください。
          </p>

          {errorMessage && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm" role="alert">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm" role="alert">
              {successMessage}
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-ink-700 mb-1">
              リセットコード
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-3 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-ink-700 mb-1">
              新しいパスワード
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="8文字以上"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-400 hover:text-ink-600"
                aria-label={showNewPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showNewPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-700 mb-1">
              パスワード確認
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="もう一度入力"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-400 hover:text-ink-600"
                aria-label={showConfirmPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "再設定中..." : "パスワードを再設定"}
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
