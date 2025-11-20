import { getUserTransactionsRef, getUserSyncStatusRef, isFirebaseAvailable } from '../config/firebase';
import { loadTransactions, insertTransaction } from './db';
import { Transaction } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_STATUS_KEY = '@sync_status';
const LAST_SYNC_KEY = '@last_sync_time';

export interface SyncStatus {
  lastSyncTime: number | null;
  isSyncing: boolean;
  pendingUploads: number;
  error: string | null;
}

let syncStatusListeners: Array<(status: SyncStatus) => void> = [];
let currentStatus: SyncStatus = {
  lastSyncTime: null,
  isSyncing: false,
  pendingUploads: 0,
  error: null,
};

/**
 * Subscribe to sync status changes
 */
export const onSyncStatusChange = (callback: (status: SyncStatus) => void) => {
  syncStatusListeners.push(callback);
  callback(currentStatus); // Immediately call with current status
  
  return () => {
    syncStatusListeners = syncStatusListeners.filter(cb => cb !== callback);
  };
};

/**
 * Update sync status and notify listeners
 */
const updateSyncStatus = (updates: Partial<SyncStatus>) => {
  currentStatus = { ...currentStatus, ...updates };
  syncStatusListeners.forEach(listener => listener(currentStatus));
  
  // Save to AsyncStorage
  AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(currentStatus));
};

/**
 * Upload a single transaction to Firestore
 */
export const uploadTransaction = async (transaction: Transaction, userId: string = 'default'): Promise<void> => {
  if (!isFirebaseAvailable) {
    console.log('⚠️ Firebase not available - skipping upload');
    return;
  }

  try {
    const transactionsRef = getUserTransactionsRef(userId);
    
    // Use transaction ID as document ID for consistency
    await transactionsRef.doc(transaction.id).set({
      ...transaction,
      syncedAt: Date.now(),
    }, { merge: true });
    
    console.log('✅ Uploaded transaction:', transaction.id);
  } catch (error) {
    console.error('❌ Failed to upload transaction:', error);
    throw error;
  }
};

/**
 * Download all transactions from Firestore
 */
export const downloadTransactions = async (userId: string = 'default'): Promise<Transaction[]> => {
  if (!isFirebaseAvailable) {
    console.log('⚠️ Firebase not available - returning empty list');
    return [];
  }

  try {
    const transactionsRef = getUserTransactionsRef(userId);
    const snapshot = await transactionsRef.get();
    
    const transactions: Transaction[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: data.id,
        amount: data.amount,
        merchant: data.merchant,
        category: data.category,
        date: data.date,
        source: data.source,
        upiRef: data.upiRef,
        rawMessage: data.rawMessage,
        createdAt: data.createdAt,
      });
    });
    
    console.log(`✅ Downloaded ${transactions.length} transactions from Firestore`);
    return transactions;
  } catch (error) {
    console.error('❌ Failed to download transactions:', error);
    throw error;
  }
};

/**
 * Sync local SQLite database with Firestore
 * Strategy: Two-way merge using timestamps
 */
export const syncWithFirestore = async (userId: string = 'default'): Promise<void> => {
  if (!isFirebaseAvailable) {
    console.log('⚠️ Firebase not available - skipping sync');
    return;
  }

  if (currentStatus.isSyncing) {
    console.log('⏳ Sync already in progress, skipping...');
    return;
  }

  updateSyncStatus({ isSyncing: true, error: null });

  try {
    // Step 1: Get local transactions
    const localTransactions = await loadTransactions();
    console.log(`📱 Local: ${localTransactions.length} transactions`);

    // Step 2: Get Firestore transactions
    const firestoreTransactions = await downloadTransactions(userId);
    console.log(`☁️ Firestore: ${firestoreTransactions.length} transactions`);

    // Step 3: Create maps for efficient lookup
    const localMap = new Map(localTransactions.map(t => [t.id, t]));
    const firestoreMap = new Map(firestoreTransactions.map(t => [t.id, t]));

    // Step 4: Upload new local transactions to Firestore
    let uploadCount = 0;
    for (const localTx of localTransactions) {
      const firestoreTx = firestoreMap.get(localTx.id);
      
      if (!firestoreTx) {
        // New local transaction, upload it
        await uploadTransaction(localTx, userId);
        uploadCount++;
      } else if (localTx.createdAt > firestoreTx.createdAt) {
        // Local is newer, upload it
        await uploadTransaction(localTx, userId);
        uploadCount++;
      }
    }

    // Step 5: Download new Firestore transactions to local
    let downloadCount = 0;
    for (const firestoreTx of firestoreTransactions) {
      const localTx = localMap.get(firestoreTx.id);
      
      if (!localTx) {
        // New Firestore transaction, download it
        await insertTransaction(firestoreTx);
        downloadCount++;
      } else if (firestoreTx.createdAt > localTx.createdAt) {
        // Firestore is newer, update local
        // Note: We'll need to add updateTransaction function to db.ts
        await insertTransaction(firestoreTx); // For now, insert (it will update if ID exists)
        downloadCount++;
      }
    }

    const lastSyncTime = Date.now();
    await AsyncStorage.setItem(LAST_SYNC_KEY, lastSyncTime.toString());

    updateSyncStatus({
      isSyncing: false,
      lastSyncTime,
      pendingUploads: 0,
      error: null,
    });

    console.log(`✅ Sync complete! ⬆️ ${uploadCount} uploaded, ⬇️ ${downloadCount} downloaded`);
  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    updateSyncStatus({
      isSyncing: false,
      error: error.message || 'Sync failed',
    });
    throw error;
  }
};

/**
 * Enable real-time sync (listen to Firestore changes)
 */
export const enableRealtimeSync = (userId: string = 'default'): (() => void) | null => {
  if (!isFirebaseAvailable) {
    console.log('⚠️ Firebase not available - real-time sync disabled');
    return null;
  }

  try {
    const transactionsRef = getUserTransactionsRef(userId);
    
    const unsubscribe = transactionsRef.onSnapshot(
      async (snapshot) => {
        if (!snapshot.metadata.hasPendingWrites) {
          // Changes from server, not our own writes
          const changes = snapshot.docChanges();
          
          for (const change of changes) {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              const transaction: Transaction = {
                id: data.id,
                amount: data.amount,
                merchant: data.merchant,
                category: data.category,
                date: data.date,
                source: data.source,
                upiRef: data.upiRef,
                rawMessage: data.rawMessage,
                createdAt: data.createdAt,
              };
              
              await insertTransaction(transaction);
              console.log('🔄 Real-time update:', transaction.id);
            }
          }
        }
      },
      (error) => {
        console.error('❌ Real-time sync error:', error);
        updateSyncStatus({ error: error.message });
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Failed to enable real-time sync:', error);
    return null;
  }
};

/**
 * Initialize sync service
 */
export const initSyncService = async (userId: string = 'default'): Promise<(() => void) | null> => {
  try {
    // Load last sync time from storage
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const lastSyncTime = lastSyncStr ? parseInt(lastSyncStr, 10) : null;
    
    updateSyncStatus({ lastSyncTime });

    // Try to perform initial sync with a timeout
    try {
      const syncPromise = syncWithFirestore(userId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sync timeout')), 5000)
      );
      await Promise.race([syncPromise, timeoutPromise]);
    } catch (syncError: any) {
      console.warn('⚠️ Initial sync skipped or failed:', syncError.message);
      // Don't throw - let app continue without sync
    }

    // Try to enable real-time sync, but don't fail if it doesn't work
    try {
      const unsubscribe = enableRealtimeSync(userId);
      console.log('✅ Real-time sync enabled');
      return unsubscribe;
    } catch (realtimeError) {
      console.warn('⚠️ Real-time sync not available:', realtimeError);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to initialize sync service:', error);
    // Don't throw - return null to let app continue
    return null;
  }
};

/**
 * Manual sync trigger (for sync button)
 */
export const manualSync = async (userId: string = 'default'): Promise<void> => {
  return syncWithFirestore(userId);
};

/**
 * Get current sync status
 */
export const getSyncStatus = (): SyncStatus => {
  return currentStatus;
};
