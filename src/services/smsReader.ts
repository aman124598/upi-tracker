/**
 * SMS Reader Service
 * Handles reading SMS messages from Android device and monitors new incoming SMS
 * Requires READ_SMS and RECEIVE_SMS permissions
 */

import * as SMS from 'expo-sms';
import { PermissionsAndroid, Platform, DeviceEventEmitter, NativeModules, NativeEventEmitter } from 'react-native';
import { parseSMS, isOTPMessage, isPromotionalMessage } from './parser';
import { categorizeTransaction } from './categorizer';
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
      async (message: { body: string; address: string }) => {
        console.log('📱 New SMS received from:', message.address);
        await processSingleSMS(message.body);
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

    // For now, return mock data to demonstrate the flow
    console.log('📱 SMS reading requires native module implementation');
    console.log('📝 See src/services/smsReader.ts for integration details');

    // In production, you would iterate through real messages:
    // for (const smsMessage of messages) {
    //   await processSingleSMS(smsMessage.body);
    // }

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

/**
 * Manually add SMS for testing purposes
 * Useful for testing the parser without actual SMS access
 */
export const addTestTransaction = async (smsText: string): Promise<boolean> => {
  return await processSingleSMS(smsText);
};

/**
 * Get sample SMS messages for testing
 */
export const getSampleSMS = (): string[] => {
  return [
    'Rs 450.00 debited from A/C XX1234 on 15-Nov-24 to VPA zomato@paytm via UPI. Ref 433847362847. -SBI',
    'You have paid Rs.1200 to Swiggy via Google Pay. UPI Ref No: 434958473829',
    'Your A/C XX5678 is debited with Rs.2500.00 on 16-Nov-24. Paid to FLIPKART via PhonePe. Ref: 837463829471',
    'INR 89.00 debited from your account for Mobile Recharge - Jio via BHIM UPI. Ref: 123456789012',
    'Rs.3500 transferred to Uber India via GPay on 17-Nov-24. UPI Ref: 938475839201',
    'Payment of Rs 750.50 made to BigBasket via PhonePe. Transaction ID: 847362940183',
    'Your OTP for login is 123456. Do not share with anyone. -HDFC Bank',
    'Congratulations! You have won Rs.10,000 cashback. Click here to claim now!',
  ];
};

/**
 * Test parser with sample SMS
 */
export const testParser = async (): Promise<void> => {
  const samples = getSampleSMS();
  
  console.log('🧪 Testing SMS Parser...\n');
  
  for (let i = 0; i < samples.length; i++) {
    console.log(`\n📱 SMS ${i + 1}:`);
    console.log(samples[i]);
    console.log('\n📊 Parsed Result:');
    
    const result = parseSMS(samples[i]);
    if (result) {
      console.log('✅ Valid UPI Transaction');
      console.log('Amount:', '₹' + result.amount);
      console.log('Merchant:', result.merchant);
      console.log('Source:', result.source);
      console.log('Category:', categorizeTransaction(result.merchant));
      if (result.upiRef) {
        console.log('UPI Ref:', result.upiRef);
      }
    } else {
      console.log('❌ Not a valid UPI transaction or filtered out');
    }
    console.log('---');
  }
};

/**
 * Import sample transactions for testing
 */
export const importSampleTransactions = async (): Promise<number> => {
  const samples = getSampleSMS();
  let imported = 0;

  for (const sms of samples) {
    const success = await processSingleSMS(sms);
    if (success) {
      imported++;
    }
  }

  console.log(`✅ Imported ${imported} sample transactions`);
  return imported;
};
