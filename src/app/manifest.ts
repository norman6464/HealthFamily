import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HealthFamily',
    short_name: 'HealthFamily',
    description: '家族もペットも、みんなの健康を守る服薬管理アプリ',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f2f2',
    theme_color: '#e8d4dc',
    lang: 'ja',
    categories: ['health', 'medical', 'lifestyle'],
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
