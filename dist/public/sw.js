var SW_VERSION = "2026-04-07-v1";

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) { return caches.delete(name); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Intercept Vite pre-bundled dependency requests and always fetch fresh,
// bypassing the browser HTTP cache. This prevents stale React chunks from
// being served when Vite re-optimizes its dep bundle mid-session.
self.addEventListener("fetch", function (event) {
  var url = event.request.url;
  if (
    url.indexOf("/node_modules/.vite/deps/") !== -1 ||
    url.indexOf("/@fs/") !== -1 ||
    url.indexOf("/@vite/") !== -1 ||
    url.indexOf("/@react-refresh") !== -1
  ) {
    event.respondWith(
      fetch(event.request.url, {
        cache: "no-store",
        credentials: "same-origin"
      }).catch(function () {
        return fetch(event.request);
      })
    );
    return;
  }
});

// ── Push notifications ────────────────────────────────────────────────────────
// Uses the wallet favicon as the notification icon so it appears like any
// other app notification in the device notification shade.
self.addEventListener("push", function (event) {
  var data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Lumirra Wallet", body: event.data.text() };
    }
  }

  var title = data.title || "Lumirra Wallet";
  var body  = data.body  || "You have a new notification.";
  var tag   = (data.data && data.data.tag) || data.tag || data.type || "lumirra-general";
  var url   = (data.data && data.data.url) ? data.data.url : "/";

  // Always use the wallet favicon — matches what the user sees as the app icon
  var iconUrl = self.location.origin + "/favicon.png";

  var options = {
    body:    body,
    // favicon used as the notification icon — displayed inline like any app notification
    icon:    iconUrl,
    // badge is the small monochrome icon shown in the Android status bar
    badge:   iconUrl,
    tag:     tag,
    // Replace existing notifications of the same type rather than stacking
    renotify: true,
    // Vibration pattern: subtle, wallet-specific feel
    vibrate: [120, 80, 120, 80, 300],
    // requireInteraction: false so it behaves like a standard system notification
    requireInteraction: false,
    // Pass-through data for the click handler
    data: Object.assign({}, data.data || {}, { url: url }),
    // Timestamp shown in the notification shade ("X minutes ago")
    timestamp: Date.now(),
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Try to focus an existing tab first
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) !== -1 && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // No existing tab — open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ── Push subscription change ─────────────────────────────────────────────────
// Android sometimes rotates the push subscription (e.g. after a reinstall or
// FCM token refresh). Re-subscribe and send the new endpoint to the server.
self.addEventListener("pushsubscriptionchange", function (event) {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription
        ? event.oldSubscription.options.applicationServerKey
        : null
    }).then(function (newSubscription) {
      return fetch("/api/push/resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: newSubscription.toJSON() }),
        credentials: "same-origin"
      });
    }).catch(function () {})
  );
});
