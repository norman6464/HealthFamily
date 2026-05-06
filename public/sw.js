/* HealthFamily Service Worker
 *
 * 役割:
 *  - PWAインストール要件を満たす(install/fetch ハンドラ)
 *  - 静的アセットのキャッシュ
 *  - "今日の予定" APIを stale-while-revalidate でキャッシュ → 圏外でも直近データ閲覧可
 *  - GET 以外、認証ページ、Server Action 等は素通し
 */

const CACHE_VERSION = 'health-family-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = ['/', '/icon.png', '/apple-icon.png', '/manifest.webmanifest'];

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

const isCacheableApi = (url) => url.pathname === '/api/schedules/today';
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
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone()).catch(() => undefined);
            }
            return response;
          })
          .catch(() => undefined);
        const cached = await cache.match(request);
        return cached || (await networkPromise) || Response.error();
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
