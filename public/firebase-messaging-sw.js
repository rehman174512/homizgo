// Firebase Messaging Service Worker
// Uses Firebase compat SDK (required in SW context)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBznRcv1gOEE_iWrh1OJv0s1TL0W71ylaM",
  authDomain: "homizgo-24cc0.firebaseapp.com",
  projectId: "homizgo-24cc0",
  storageBucket: "homizgo-24cc0.firebasestorage.app",
  messagingSenderId: "982782566465",
  appId: "1:982782566465:web:3c96424a213c98d83e66c0",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'Homizgo', {
    body: body || 'You have a new notification.',
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    tag: 'homizgo-notification',
    requireInteraction: false,
  });
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
