/**
 * TypeScript Type Definitions
 * All interfaces and types used throughout the app
 */

// Transaction categories
export type TransactionCategory = 
  | 'Food' 
  | 'Shopping' 
  | 'Bills' 
  | 'Travel' 
  | 'Groceries' 
  | 'Recharge' 
  | 'Entertainment'
  | 'Healthcare'
  | 'Others';

// Transaction source (payment app/bank)
export type TransactionSource = 
  | 'GPay' 
  | 'PhonePe' 
  | 'Paytm' 
  | 'BHIM' 
  | 'Bank' 
  | 'Manual' 
  | 'Unknown';

// Main Transaction interface
export interface Transaction {
  id?: number;
  amount: number;
  merchant: string;
  category: TransactionCategory;
  date: string; // ISO format: YYYY-MM-DD HH:mm:ss
  source: TransactionSource;
  upiRef?: string;
  rawMessage?: string;
  createdAt?: string;
}

// Parsed SMS data before saving to DB
export interface ParsedSMS {
  amount: number;
  merchant: string;
  date: string;
  source: TransactionSource;
  upiRef?: string;
  rawMessage: string;
}

// Monthly spending summary
export interface MonthlySpending {
  month: string; // YYYY-MM
  totalSpent: number;
  transactionCount: number;
}

// Category-wise spending for pie chart
export interface CategorySpending {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  count: number;
}

// Daily spending for bar/line chart
export interface DailySpending {
  date: string; // YYYY-MM-DD
  amount: number;
}

// Top merchants
export interface MerchantSpending {
  merchant: string;
  totalAmount: number;
  transactionCount: number;
}

// Filter options for transaction list
export interface TransactionFilter {
  category?: TransactionCategory;
  source?: TransactionSource;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

// Sort options
export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

// App settings
export interface AppSettings {
  spendingLimit?: number;
  currency: string;
  lastSyncDate?: string;
}
