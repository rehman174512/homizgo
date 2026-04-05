import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Messaging is only supported in browsers with ServiceWorker + Notification support
let messaging = null;
const messagingPromise = isSupported()
  .then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
    return messaging;
  })
  .catch(() => null);

export { messaging, messagingPromise };
export default app;
