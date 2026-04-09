const CACHE = "foodra-v1";
const STATIC = ["/", "/marketplace", "/training", "/funding", "/wallet", "/offline.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Skip API and external requests — always network
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
      return cached || network.catch(() => caches.match("/offline.html"));
    })
  );
});

// Push notifications
self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {};
  const title = data.title || "Foodra";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-32x32.png",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url === url && "focus" in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// Allow update banner to trigger immediate activation
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
