/**
 * Firebase Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Add an Android app to your project
 * 4. Download google-services.json
 * 5. Place it in: android/app/google-services.json
 * 6. The config below will be auto-loaded from that file
 * 
 * For iOS (if needed later):
 * - Download GoogleService-Info.plist
 * - Place it in: ios/upitracker/GoogleService-Info.plist
 */

let firebase: any = null;
let db: any = null;
let isFirebaseAvailable = false;

// Try to initialize Firebase - will fail gracefully if not available (e.g., in Expo Go)
try {
  firebase = require('@react-native-firebase/app').default;
  const firestore = require('@react-native-firebase/firestore').default;
  
  // Firebase initializes automatically from google-services.json
  db = firestore();
  isFirebaseAvailable = true;
  console.log('✅ Firebase initialized successfully');
} catch (error: any) {
  console.warn('⚠️ Firebase not available:', error.message);
  console.warn('💡 App will work offline. To enable cloud sync, build with EAS or rebuild with Firebase native modules.');
  isFirebaseAvailable = false;
}

// Collections
export const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  USERS: 'users',
  SYNC_STATUS: 'syncStatus',
};

// Helper to get user's transaction collection
export const getUserTransactionsRef = (userId: string = 'default') => {
  if (!isFirebaseAvailable || !db) {
    throw new Error('Firebase not initialized. App is running in offline mode.');
  }
  return db.collection(COLLECTIONS.USERS)
    .doc(userId)
    .collection(COLLECTIONS.TRANSACTIONS);
};

// Helper to get sync status
export const getUserSyncStatusRef = (userId: string = 'default') => {
  if (!isFirebaseAvailable || !db) {
    throw new Error('Firebase not initialized. App is running in offline mode.');
  }
  return db.collection(COLLECTIONS.USERS)
    .doc(userId)
    .collection(COLLECTIONS.SYNC_STATUS)
    .doc('status');
};

export { firebase, db, isFirebaseAvailable };
