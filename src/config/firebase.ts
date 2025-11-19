import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

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

// Firebase initializes automatically from google-services.json
// No need to call initializeApp() manually

export const db = firestore();

// Collections
export const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  USERS: 'users',
  SYNC_STATUS: 'syncStatus',
};

// Helper to get user's transaction collection
export const getUserTransactionsRef = (userId: string = 'default') => {
  return db.collection(COLLECTIONS.USERS)
    .doc(userId)
    .collection(COLLECTIONS.TRANSACTIONS);
};

// Helper to get sync status
export const getUserSyncStatusRef = (userId: string = 'default') => {
  return db.collection(COLLECTIONS.USERS)
    .doc(userId)
    .collection(COLLECTIONS.SYNC_STATUS)
    .doc('status');
};

export default firebase;
