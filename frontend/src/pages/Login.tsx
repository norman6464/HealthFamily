import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'UserNotConfirmedException') {
          navigate('/signup', { state: { email, needsConfirmation: true } });
          return;
        }
        setErrorMessage(
          err.name === 'NotAuthorizedException'
            ? 'メールアドレスまたはパスワードが正しくありません'
            : err.message
        );
      } else {
        setErrorMessage('ログインに失敗しました');
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
          <p className="text-gray-500 mt-2">ログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg" role="alert">
              {errorMessage}
            </div>
          )}

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="パスワードを入力"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          アカウントをお持ちでない方は{' '}
          <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
