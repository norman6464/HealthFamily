'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || '登録に失敗しました');
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage('登録は完了しましたが、ログインに失敗しました。ログイン画面からお試しください。');
      } else {
        router.push('/');
      }
    } catch {
      setErrorMessage('登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">HealthFamily</h1>
          <p className="mt-2 text-gray-500">新規登録</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm" role="alert">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="example@example.com"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="8文字以上"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? '登録中...' : '登録'}
          </button>

          <p className="text-center text-sm text-gray-500">
            既にアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-primary-600 hover:underline">
              ログイン
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
