// Self-unregistering dev service worker.
// Purpose: remove old vite-plugin-pwa dev SWs that can cause blank screens on reload.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch (e) {
        // ignore
      }

      try {
        await self.registration.unregister();
      } catch (e) {
        // ignore
      }

      try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        await Promise.all(
          clients.map((client) => {
            try {
              return client.navigate(client.url);
            } catch (e) {
              return null;
            }
          })
        );
      } catch (e) {
        // ignore
      }
    })()
  );
});

self.addEventListener('fetch', () => {
  // no-op
});
