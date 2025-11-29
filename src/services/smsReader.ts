/**
 * SMS Reader Service
 * Handles reading SMS messages from Android device and monitors new incoming SMS
 * Requires READ_SMS and RECEIVE_SMS permissions
 */

import * as SMS from 'expo-sms';
import { PermissionsAndroid, Platform, DeviceEventEmitter, NativeModules, NativeEventEmitter } from 'react-native';
import { parseSMS, isOTPMessage, isPromotionalMessage } from './parser';
import { categorizeTransaction } from './categorizer';
import { useTransactionStore } from '../store/transactionStore';
import { insertTransaction, transactionExists } from './db';
import { Transaction } from '../types';

let smsListener: any = null;

/**
 * Request SMS read and receive permissions from user
 */
export const requestSMSPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    console.log('⚠️ SMS reading only supported on Android');
    return false;
  }

  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);

    const allGranted = Object.values(granted).every(
      (status) => status === PermissionsAndroid.RESULTS.GRANTED
    );

    if (allGranted) {
      console.log('✅ SMS permissions granted');
      return true;
    } else {
      console.log('❌ SMS permissions denied');
      return false;
    }
  } catch (err) {
    console.error('❌ Error requesting SMS permission:', err);
    return false;
  }
};

/**
 * Check if SMS permission is granted
 */
export const checkSMSPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const readGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    const receiveGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
    );
    return readGranted && receiveGranted;
  } catch (err) {
    console.error('❌ Error checking SMS permission:', err);
    return false;
  }
};

/**
 * Start monitoring incoming SMS for UPI transactions
 * Call this on app startup after permissions are granted
 */
export const startSMSMonitoring = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    console.log('⚠️ SMS monitoring only supported on Android');
    return false;
  }

  try {
    // Check permissions
    const hasPermission = await checkSMSPermission();
    if (!hasPermission) {
      console.log('❌ SMS permissions not granted, requesting...');
      const granted = await requestSMSPermission();
      if (!granted) {
        console.log('❌ Cannot start SMS monitoring without permissions');
        return false;
      }
    }

    // Listen for incoming SMS using DeviceEventEmitter
    // Note: This requires a native module to emit events
    // For Expo managed workflow, you'll need expo-dev-client
    smsListener = DeviceEventEmitter.addListener(
      'onSMSReceived',
      async (message: any) => {
        // message may be either { body, address } or structured { body, sender, amount, merchant, upiRef }
        try {
          console.log('📱 New SMS event received:', message);

          // If native emitter provided structured payload, prefer it
          if (message && (message.amount !== undefined || message.merchant || message.upiRef)) {
            const rawMessage = message.body || '';
            const upiRef = message.upiRef || undefined;

            // Avoid duplicates: check by upiRef or rawMessage
            const exists = upiRef ? await transactionExists(upiRef) : await transactionExists(rawMessage);
            if (exists) {
              console.log('⏭️ Duplicate transaction detected, skipping JS insert');
              // Ensure UI/store reloads data from native DB (in case native inserted while app running)
              try {
                const store = useTransactionStore.getState();
                if (store && store.refreshTransactions) {
                  store.refreshTransactions();
                }
              } catch (e) {
                console.warn('Failed to refresh store after native SMS insert:', e);
              }
              return;
            }

            const merchantName = message.merchant || 'Unknown';
            const categorized = categorizeTransaction(merchantName);
            const transaction: Transaction = {
              amount: Number(message.amount) || 0,
              merchant: merchantName,
              category: categorized,
              date: new Date().toISOString(),
              source: 'sms',
              upiRef,
              rawMessage,
            };

            await insertTransaction(transaction);
            console.log('✅ Inserted transaction from native event:', transaction.merchant, '₹' + transaction.amount);
            return;
          }

          // Fallback to raw SMS processing
          if (message && message.body) {
            console.log('📱 New SMS received from:', message.address || 'unknown');
            await processSingleSMS(message.body);
          }
        } catch (err) {
          console.error('Error handling onSMSReceived event:', err);
        }
      }
    );

    console.log('✅ SMS monitoring started');
    return true;
  } catch (error) {
    console.error('❌ Error starting SMS monitoring:', error);
    return false;
  }
};

/**
 * Stop SMS monitoring
 */
export const stopSMSMonitoring = (): void => {
  if (smsListener) {
    smsListener.remove();
    smsListener = null;
    console.log('🛑 SMS monitoring stopped');
  }
};

/**
 * Read SMS messages from device (Android only)
 * Note: Due to Expo limitations, actual SMS reading requires a native module
 * This is a placeholder that demonstrates the flow
 */
export const readSMSMessages = async (
  limit: number = 100
): Promise<{ success: number; failed: number; duplicates: number }> => {
  let success = 0;
  let failed = 0;
  let duplicates = 0;

  try {
    // Check permission first
    const hasPermission = await checkSMSPermission();
    if (!hasPermission) {
      const granted = await requestSMSPermission();
      if (!granted) {
        throw new Error('SMS permission not granted');
      }
    }

    /**
     * IMPORTANT: Expo doesn't provide direct SMS reading API
     * In a real implementation, you would need to:
     * 1. Use react-native-get-sms-android package
     * 2. Or create a custom native module
     * 3. Or use expo-dev-client with native code
     * 
     * For demo purposes, this is the structure of how it would work:
     */

    // Example structure (would need native module):
    // const messages = await NativeSMSModule.list({
    //   box: 'inbox',
    //   maxCount: limit,
    // });

    // For now, return empty result as native module is required
    console.log('📱 SMS reading requires native module implementation');
    console.log('📝 See src/services/smsReader.ts for integration details');

    return { success, failed, duplicates };
  } catch (error) {
    console.error('❌ Error reading SMS:', error);
    throw error;
  }
};

/**
 * Process a single SMS message
 */
export const processSingleSMS = async (messageBody: string): Promise<boolean> => {
  try {
    // Skip OTP and promotional messages
    if (isOTPMessage(messageBody) || isPromotionalMessage(messageBody)) {
      console.log('⏭️ Skipped non-transaction SMS');
      return false;
    }

    // Check if already processed (avoid duplicates)
    const exists = await transactionExists(messageBody);
    if (exists) {
      console.log('⏭️ Duplicate transaction, skipping');
      return false;
    }

    // Parse SMS
    const parsed = parseSMS(messageBody);
    if (!parsed) {
      console.log('⏭️ Could not parse SMS as UPI transaction');
      return false;
    }

    // Auto-categorize
    const category = categorizeTransaction(parsed.merchant);

    // Create transaction object
    const transaction: Transaction = {
      amount: parsed.amount,
      merchant: parsed.merchant,
      category: category,
      date: parsed.date,
      source: parsed.source,
      upiRef: parsed.upiRef,
      rawMessage: parsed.rawMessage,
    };

    // Save to database
    await insertTransaction(transaction);
    console.log('✅ Transaction added:', transaction.merchant, '₹' + transaction.amount);

    return true;
  } catch (error) {
    console.error('❌ Error processing SMS:', error);
    return false;
  }
};


