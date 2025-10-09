import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

// Firebase configuration
// These will be populated from your .env file once you set up Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (reuse existing app on hot reload)
let app;
let auth;
let db;

try {
  // Reuse existing Firebase app if already initialized (Expo hot reload compatibility)
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
  } else {
    app = getApp();
    console.log('♻️ Reusing existing Firebase app');
  }

  // Get auth instance
  auth = getAuth(app);

  // Initialize Firestore with long-polling for React Native/Expo compatibility
  // Try to get existing instance first (hot reload), otherwise initialize new
  try {
    db = getFirestore(app);
    console.log('♻️ Reusing existing Firestore instance');
  } catch (firestoreError) {
    // Firestore not initialized yet, create with long-polling
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
    });
    console.log('✅ Firestore initialized with long-polling');
  }

} catch (error) {
  // Log actual error for debugging
  console.error('❌ Firebase initialization error:', error.message);

  // Check if it's a config issue
  const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
  if (!hasConfig) {
    console.log('⚠️ Firebase not configured. Add credentials to .env file.');
  }
}

export { auth, db };
