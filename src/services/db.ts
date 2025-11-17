/**
 * Local AsyncStorage-backed database
 * 
 * This provides a persistent local storage solution that works in Expo Go
 * without requiring native modules or a remote backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, TransactionFilter, DailySpending, MerchantSpending } from '../types';

const STORAGE_KEY = '@upi_tracker_transactions';

let transactionsCache: Transaction[] = [];
let nextId = 1;

const loadTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      transactionsCache = JSON.parse(data);
      if (transactionsCache.length > 0) {
        nextId = Math.max(...transactionsCache.map(t => t.id || 0)) + 1;
      }
    }
    return transactionsCache;
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};

const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  try {
    transactionsCache = transactions;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions:', error);
  }
};

export const initDatabase = async (): Promise<void> => {
  await loadTransactions();
  console.log('✅ Local database initialized');
};

export const insertTransaction = async (transaction: Transaction): Promise<number> => {
  const transactions = await loadTransactions();
  const id = nextId++;
  const newTransaction = {
    ...transaction,
    id,
    createdAt: transaction.createdAt || new Date().toISOString(),
  };
  transactions.push(newTransaction);
  await saveTransactions(transactions);
  return id;
};

export const updateTransaction = async (id: number, updates: Partial<Transaction>): Promise<void> => {
  const transactions = await loadTransactions();
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    await saveTransactions(transactions);
  }
};

export const deleteTransaction = async (id: number): Promise<void> => {
  const transactions = await loadTransactions();
  const filtered = transactions.filter(t => t.id !== id);
  await saveTransactions(filtered);
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const transactions = await loadTransactions();
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getTransactionsByMonth = async (month: string): Promise<Transaction[]> => {
  const transactions = await loadTransactions();
  return transactions
    .filter(t => t.date.startsWith(month))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getDailySpending = async (month: string): Promise<DailySpending[]> => {
  const transactions = await getTransactionsByMonth(month);
  const dailyMap = new Map<string, number>();
  
  transactions.forEach(t => {
    const dateKey = t.date.split('T')[0];
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + t.amount);
  });
  
  return Array.from(dailyMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getTopMerchants = async (month: string, limit: number = 5): Promise<MerchantSpending[]> => {
  const transactions = await getTransactionsByMonth(month);
  const merchantMap = new Map<string, { totalAmount: number; transactionCount: number }>();
  
  transactions.forEach(t => {
    const current = merchantMap.get(t.merchant) || { totalAmount: 0, transactionCount: 0 };
    merchantMap.set(t.merchant, {
      totalAmount: current.totalAmount + t.amount,
      transactionCount: current.transactionCount + 1,
    });
  });
  
  return Array.from(merchantMap.entries())
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
};

export const searchTransactions = async (searchTerm: string): Promise<Transaction[]> => {
  const transactions = await loadTransactions();
  const term = searchTerm.toLowerCase();
  return transactions
    .filter(t => 
      t.merchant.toLowerCase().includes(term) ||
      t.upiRef?.toLowerCase().includes(term) ||
      t.rawMessage?.toLowerCase().includes(term)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const filterTransactions = async (filter: TransactionFilter): Promise<Transaction[]> => {
  const transactions = await loadTransactions();
  
  return transactions.filter(t => {
    if (filter.category && t.category !== filter.category) return false;
    if (filter.source && t.source !== filter.source) return false;
    if (filter.startDate && t.date < filter.startDate) return false;
    if (filter.endDate && t.date > filter.endDate) return false;
    if (filter.minAmount !== undefined && t.amount < filter.minAmount) return false;
    if (filter.maxAmount !== undefined && t.amount > filter.maxAmount) return false;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const transactionExists = async (value: string): Promise<boolean> => {
  const transactions = await loadTransactions();
  return transactions.some(t => t.upiRef === value || t.rawMessage === value);
};

export const getTransactionCount = async (): Promise<number> => {
  const transactions = await loadTransactions();
  return transactions.length;
};

export const deleteAllTransactions = async (): Promise<void> => {
  await saveTransactions([]);
};

export const getMonthlyStats = async (month: string) => {
  const transactions = await getTransactionsByMonth(month);
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const count = transactions.length;
  const average = count > 0 ? total / count : 0;
  return { total, count, average };
};

