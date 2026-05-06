/* HealthFamily Service Worker
 *
 * 役割:
 *  - PWAインストール要件を満たす (install/fetch ハンドラ)
 *  - 静的アセットを cache-first で配信
 *  - "今日の予定" APIなど読み取り系は network-first でキャッシュは
 *    オフライン時のフォールバックとしてのみ使用 → mutation 後の表示が即時に反映される
 *  - GET 以外, 認証, mutation 系 API は素通し
 */

const CACHE_VERSION = 'health-family-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = ['/', '/icon.svg', '/icon.png', '/apple-icon.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => undefined),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

const isCacheableApi = (url) =>
  url.pathname === '/api/schedules/today' ||
  url.pathname === '/api/schedules/missed' ||
  url.pathname === '/api/medications/alerts' ||
  url.pathname === '/api/records/stats';

const isAuthRoute = (url) =>
  url.pathname.startsWith('/api/auth/') ||
  url.pathname === '/login' ||
  url.pathname === '/signup' ||
  url.pathname === '/verify' ||
  url.pathname === '/reset-password' ||
  url.pathname === '/forgot-password';

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isAuthRoute(url)) return;

  if (url.pathname.startsWith('/api/')) {
    if (!isCacheableApi(url)) return;
    // network-first: 通常はネットワーク, 失敗時のみキャッシュにフォールバック
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone()).catch(() => undefined);
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok && response.type === 'basic') {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, response.clone()).catch(() => undefined);
        }
        return response;
      } catch {
        const fallback = await caches.match('/');
        return fallback || Response.error();
      }
    })(),
  );
});
