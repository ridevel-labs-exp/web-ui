import fs from 'fs';
import path from 'path';

// Load environment variables injected by Vercel during build time
const apiKey = process.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY";
const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || "ridevel-labs-exp.firebaseapp.com";
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "ridevel-labs-exp";
const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET || "ridevel-labs-exp.appspot.com";
const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID";
const appId = process.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID";

const swContent = `// Auto-generated Service Worker by Vercel Build Script
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Message: ', payload);
  const notificationTitle = payload.notification.title || "Ridevel Update";
  const notificationOptions = {
    body: payload.notification.body || "You have a new status update.",
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
`;

// Write the compiled service worker directly to Vite's public assets folder
const publicPath = path.resolve('public');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath);
}

fs.writeFileSync(path.join(publicPath, 'firebase-messaging-sw.js'), swContent, 'utf-8');
console.log('>>> Firebase Service Worker successfully compiled with Vercel Environment Variables.');
