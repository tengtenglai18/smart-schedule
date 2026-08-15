const CACHE_NAME = "smart-schedule-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

// 安裝 Service Worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// 啟用新的 Service Worker
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

// 網路請求
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// 接收 Push 通知
self.addEventListener("push", event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {
      title: "行程提醒",
      body: event.data ? event.data.text() : "你有一個行程到了"
    };
  }

  const title = data.title || "🔔 行程提醒";

  const options = {
    body: data.body || "你有一個行程需要注意",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    data: data.url || "./",
    tag: "smart-schedule-reminder",
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 使用者點擊通知
self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clientList => {

      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || "./");
      }
    })
  );
});
