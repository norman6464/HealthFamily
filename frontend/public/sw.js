// 自己解除する Service Worker（kill-switch）
// 旧 Next.js PWA が登録した /sw.js を全クライアントから確実に取り除くためのもの。
// React Router(SPA)版は Service Worker を使わないため、この SW は登録解除と
// キャッシュ全削除だけを行い、開いているタブをリロードする。
self.addEventListener('install', () => {
  // 直ちに新しい SW を有効化
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // 旧 PWA のキャッシュをすべて削除
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        /* noop */
      }
      // 自身を登録解除
      try {
        await self.registration.unregister();
      } catch {
        /* noop */
      }
      // 開いている全タブを再読み込みして、SW なしの状態に戻す
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        try {
          client.navigate(client.url);
        } catch {
          /* noop */
        }
      }
    })(),
  );
});

// fetch は一切横取りしない（旧 SW のような介入をしない）
