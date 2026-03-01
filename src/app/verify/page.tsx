'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  const [email] = useState(emailParam);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!emailParam) {
      router.push('/signup');
    }
  }, [emailParam, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || '認証に失敗しました');
        return;
      }

      setSuccessMessage('メール認証が完了しました。ログイン画面に移動します。');
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setErrorMessage('認証に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('確認コードを再送信しました');
      } else {
        setErrorMessage(data.error || '再送信に失敗しました');
      }
    } catch {
      setErrorMessage('再送信に失敗しました');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">HealthFamily</h1>
          <p className="mt-2 text-gray-500">メールアドレスの確認</p>
        </div>

        <form onSubmit={handleVerify} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <p className="text-sm text-gray-600">
            <strong>{email}</strong> に送信された6桁の確認コードを入力してください。
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
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              確認コード
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? '確認中...' : '確認する'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-sm text-primary-600 hover:underline disabled:opacity-50"
            >
              {isResending ? '送信中...' : '確認コードを再送信'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500">
            <Link href="/signup" className="text-primary-600 hover:underline">
              登録画面に戻る
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function Verify() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
