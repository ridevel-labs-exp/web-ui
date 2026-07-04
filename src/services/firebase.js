import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Replace placeholders with your copied firebaseConfig values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ridevel-labs-exp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ridevel-labs-exp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ridevel-labs-exp.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request user browser permission for push notifications and retrieve token
export const requestNotificationPermission = async () => {
  try {
    // Standard web permission alert popup
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Push notification permission granted by user.');
      
      // Paste your VAPID Key pair string here (generated in Step 3 of the settings page)
      const token = await getToken(messaging, { 
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_PUBLIC_KEY' 
      });
      
      console.log('FCM Registration Token generated: ', token);
      
      // In production, we register this token on the backend to push targeted messages:
      // await alertService.registerPushToken(token);
      
      return token;
    } else {
      console.warn('Push notification permission denied by user.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving FCM token: ', error);
  }
  return null;
};

// Listen to messages while the website is active and open (Foreground messages)
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Foreground Push Message Received: ', payload);
      resolve(payload);
    });
  });
