import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Real production Firebase web configuration for Ridevel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyABxz63cw6cacpFqa6kLlccDZlfiUBmKEM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ridevel-labs-exp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ridevel-labs-exp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ridevel-labs-exp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "302787408996",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:302787408996:web:fe8820d4b0dd9a96b91b71"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Google Sign-In: opens popup and returns the Firebase ID token
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return {
      idToken,
      name: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL
    };
  } catch (error) {
    console.error('Google Sign-In error: ', error);
    throw error;
  }
};

// Request user browser permission for push notifications and retrieve token
export const requestNotificationPermission = async () => {
  try {
    // Standard web permission alert popup
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Push notification permission granted by user.');
      
      const token = await getToken(messaging, { 
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BF126aknJHTDiHOMlDGkHZlpJ9HgypceNGCpVHqqoOkcZE5oFdYl1dS4UUPJvJffyhguyXZWMfqa_RLktCZRqgU' 
      });
      
      console.log('FCM Registration Token generated: ', token);
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
