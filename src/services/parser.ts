/**
 * SMS Parser Service
 * Parses UPI transaction SMS messages to extract payment details
 */

import { ParsedSMS, TransactionSource } from '../types';
import { categorizeTransaction } from './categorizer';

/**
 * Main SMS parsing function
 * @param message - Raw SMS message text
 * @returns ParsedSMS object or null if not a valid UPI transaction
 */
export const parseSMS = (message: string): ParsedSMS | null => {
  // Check if it's a UPI transaction message
  if (!isUPITransaction(message)) {
    return null;
  }

  // Check if it's a failed transaction
  if (isFailedTransaction(message)) {
    return null;
  }

  // Extract amount
  const amount = extractAmount(message);
  if (!amount || amount <= 0) {
    return null;
  }

  // Extract merchant/payee name
  const merchant = extractMerchant(message);
  if (!merchant) {
    return null;
  }

  // Extract transaction source (GPay, PhonePe, etc.)
  const source = extractSource(message);

  // Extract UPI reference ID
  const upiRef = extractUPIRef(message);

  // Extract date (use current date if not found)
  const date = extractDate(message) || new Date().toISOString();

  return {
    amount,
    merchant,
    date,
    source,
    upiRef,
    rawMessage: message,
  };
};

/**
 * Check if SMS is a UPI transaction
 */
const isUPITransaction = (message: string): boolean => {
  const upiKeywords = [
    'upi',
    'debited',
    'paid',
    'transferred',
    'sent to',
    'payment',
    'transaction',
    'gpay',
    'phonepe',
    'paytm',
    'bhim',
    'google pay',
  ];

  const msgLower = message.toLowerCase();
  return upiKeywords.some((keyword) => msgLower.includes(keyword));
};

/**
 * Check if transaction failed
 */
const isFailedTransaction = (message: string): boolean => {
  const failureKeywords = [
    'failed',
    'declined',
    'rejected',
    'unsuccessful',
    'not successful',
    'could not',
    'unable to',
    'reversed',
  ];

  const msgLower = message.toLowerCase();
  return failureKeywords.some((keyword) => msgLower.includes(keyword));
};

/**
 * Extract amount from SMS
 */
const extractAmount = (message: string): number | null => {
  // Pattern: Rs, INR, ₹ followed by amount
  const patterns = [
    // SBI/Bank format: "Rs 450.00 debited" or "Rs.450.00 debited"
    /(?:rs\.?|inr)\s+(\d+(?:\.\d{2})?)\s+debited/i,
    // Format: "Rs 450.00 debited from"
    /(?:rs\.?)\s+(\d+(?:\.\d{2})?)\s+debited/i,
    // Format: "paid Rs.1200 to" or "paid Rs 1200"
    /paid\s+(?:rs\.?|inr|₹)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i,
    // Format: "transferred to X via" with amount before
    /(?:rs\.?|inr|₹)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s+(?:transferred|sent|paid)/i,
    // Format: "Amount: Rs 2500.00"
    /amount\s*:?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i,
    // Format: "INR 89.00 debited"
    /(?:inr|₹)\s+(\d+(?:\.\d{2})?)/i,
    // Generic: "Rs.1200" or "Rs 1200" anywhere
    /(?:rs\.?|₹)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      // Extract numeric value and remove commas
      const numStr = match[1].replace(/,/g, '');
      const amount = parseFloat(numStr);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return null;
};

/**
 * Extract merchant/payee name from SMS
 */
const extractMerchant = (message: string): string | null => {
  const patterns = [
    // Pattern: "to MERCHANT via" or "to MERCHANT on"
    /to\s+([A-Za-z0-9\s&-]+?)\s+(?:via|on|for|ref|upi|\.|$)/i,
    // Pattern: "paid to MERCHANT via"
    /paid\s+to\s+([A-Za-z0-9\s&-]+?)\s+(?:via|on|\.|$)/i,
    // Pattern: "Paid to MERCHANT via"
    /Paid\s+to\s+([A-Za-z0-9\s&-]+?)\s+(?:via|on|\.|$)/i,
    // Pattern: "transferred to MERCHANT via"
    /transferred\s+to\s+([A-Za-z0-9\s&-]+?)\s+(?:via|on|\.|$)/i,
    // Pattern: "sent to MERCHANT via"
    /sent\s+to\s+([A-Za-z0-9\s&-]+?)\s+(?:via|on|\.|$)/i,
    // Pattern: "VPA merchant@upi"
    /VPA\s+([A-Za-z0-9._-]+@[A-Za-z0-9._-]+)/i,
    // Pattern: "to VPA merchant@upi"
    /to\s+VPA\s+([A-Za-z0-9._-]+@[A-Za-z0-9._-]+)/i,
    // Pattern: "in favour of MERCHANT"
    /in\s+favour\s+of\s+([A-Za-z0-9\s&-]+?)(?:\s+via|\s+on|\.|$)/i,
    // Pattern: "made to MERCHANT"
    /made\s+to\s+([A-Za-z0-9\s&-]+?)(?:\s+via|\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let merchant = match[1].trim();
      
      // Clean up merchant name
      merchant = merchant.replace(/\s+/g, ' '); // Remove extra spaces
      merchant = merchant.replace(/[^\w\s@._-]/g, ''); // Remove special chars
      merchant = merchant.trim();
      
      if (merchant.length > 1 && merchant.length < 100) {
        return merchant;
      }
    }
  }

  return 'Unknown Merchant';
};

/**
 * Extract transaction source (GPay, PhonePe, etc.)
 */
const extractSource = (message: string): TransactionSource => {
  const msgLower = message.toLowerCase();

  if (msgLower.includes('google pay') || msgLower.includes('gpay') || msgLower.includes('g pay')) {
    return 'GPay';
  }
  if (msgLower.includes('phonepe') || msgLower.includes('phone pe')) {
    return 'PhonePe';
  }
  if (msgLower.includes('paytm')) {
    return 'Paytm';
  }
  if (msgLower.includes('bhim')) {
    return 'BHIM';
  }
  
  // Check for bank keywords
  const bankKeywords = ['bank', 'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'pnb'];
  if (bankKeywords.some((keyword) => msgLower.includes(keyword))) {
    return 'Bank';
  }

  return 'Unknown';
};

/**
 * Extract UPI reference ID
 */
const extractUPIRef = (message: string): string | null => {
  const patterns = [
    /(?:upi ref|ref no|reference|ref id|utr)(?:\s?:?\s?)(\w+)/gi,
    /(\d{12})/g, // 12-digit reference numbers
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
    if (match && match[0] && /^\d{12}$/.test(match[0])) {
      return match[0];
    }
  }

  return null;
};

/**
 * Extract transaction date from SMS
 */
const extractDate = (message: string): string | null => {
  // Pattern: dd-mm-yyyy or dd/mm/yyyy or dd MMM yyyy
  const datePatterns = [
    /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      try {
        // For now, return current date with proper formatting
        // In production, you'd parse the matched date properly
        return new Date().toISOString();
      } catch (e) {
        continue;
      }
    }
  }

  return null;
};

/**
 * Batch parse multiple SMS messages
 */
export const parseMultipleSMS = (messages: string[]): ParsedSMS[] => {
  const parsed: ParsedSMS[] = [];

  for (const message of messages) {
    const result = parseSMS(message);
    if (result) {
      parsed.push(result);
    }
  }

  return parsed;
};

/**
 * Check if SMS is an OTP message (to ignore)
 */
export const isOTPMessage = (message: string): boolean => {
  const otpKeywords = [
    'otp',
    'one time password',
    'verification code',
    'verify',
    'do not share',
  ];

  const msgLower = message.toLowerCase();
  return otpKeywords.some((keyword) => msgLower.includes(keyword));
};

/**
 * Check if SMS is promotional (to ignore)
 */
export const isPromotionalMessage = (message: string): boolean => {
  const promoKeywords = [
    'offer',
    'discount',
    'cashback',
    'congratulations',
    'winner',
    'claim',
    'subscribe',
    'unsubscribe',
  ];

  const msgLower = message.toLowerCase();
  
  // If it contains promo keywords but not transaction keywords, it's likely promotional
  const hasPromo = promoKeywords.some((keyword) => msgLower.includes(keyword));
  const hasTransaction = msgLower.includes('debited') || msgLower.includes('paid');

  return hasPromo && !hasTransaction;
};
