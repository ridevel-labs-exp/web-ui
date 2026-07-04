// Scripts for firebase-app and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// Paste your exact firebaseConfig credentials here:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ridevel-labs-exp.firebaseapp.com",
  projectId: "ridevel-labs-exp",
  storageBucket: "ridevel-labs-exp.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Cloud Messaging.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  const notificationTitle = payload.notification.title || "Ridevel Update";
  const notificationOptions = {
    body: payload.notification.body || "You have a new update regarding your ride status.",
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
