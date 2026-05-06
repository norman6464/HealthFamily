import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { PWARegister } from '@/components/shared/PWARegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'HealthFamily',
  description: '家族もペットも、みんなの健康をキャラクターと一緒に守る服薬管理アプリ',
  manifest: '/manifest.webmanifest',
  applicationName: 'HealthFamily',
  appleWebApp: {
    capable: true,
    title: 'HealthFamily',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#e8d4dc',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <PWARegister />
      </body>
    </html>
  );
}
