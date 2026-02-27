import { useState, FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, confirmSignUp } = useAuthStore();

  const locationState = location.state as { email?: string; needsConfirmation?: boolean } | null;

  const [email, setEmail] = useState(locationState?.email || '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [step, setStep] = useState<'register' | 'confirm'>(
    locationState?.needsConfirmation ? 'confirm' : 'register'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await signUp(email, password, displayName);
      if (result.needsConfirmation) {
        setStep('confirm');
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(
          err.name === 'UsernameExistsException'
            ? 'このメールアドレスは既に登録されています'
            : err.message
        );
      } else {
        setErrorMessage('登録に失敗しました');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await confirmSignUp(email, confirmationCode);
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(
          err.name === 'CodeMismatchException'
            ? '認証コードが正しくありません'
            : err.message
        );
      } else {
        setErrorMessage('認証に失敗しました');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-700">HealthFamily</h1>
          <p className="text-gray-500 mt-2">
            {step === 'register' ? '新規登録' : 'メール認証'}
          </p>
        </div>

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            {errorMessage && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg" role="alert">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                表示名
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="表示名を入力"
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="8文字以上（大小英字・数字を含む）"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-400 mt-1">8文字以上、大文字・小文字・数字を含むこと</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '登録中...' : '登録'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            {errorMessage && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg" role="alert">
                {errorMessage}
              </div>
            )}

            <p className="text-sm text-gray-600">
              <span className="font-medium">{email}</span> に認証コードを送信しました。
              コードを入力してください。
            </p>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                認証コード
              </label>
              <input
                id="code"
                type="text"
                required
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '認証中...' : '認証する'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          既にアカウントをお持ちの方は{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
