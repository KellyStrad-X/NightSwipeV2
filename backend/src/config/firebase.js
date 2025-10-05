const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return;
    }

    // Initialize with service account credentials
    // The service account JSON should be stored in .env as FIREBASE_SERVICE_ACCOUNT
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
      console.warn('⚠️ Firebase Admin not configured. Add FIREBASE_SERVICE_ACCOUNT to .env');
      console.warn('⚠️ Auth endpoints will not work until Firebase is configured');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
    console.warn('⚠️ Auth endpoints will not work until Firebase is configured');
  }
}

module.exports = { initializeFirebase };
