/**
 * Zustand Store for Transaction Management
 * Central state management for all transactions and analytics
 */

import { create } from 'zustand';
import {
  Transaction,
  TransactionCategory,
  CategorySpending,
  DailySpending,
  MerchantSpending,
} from '../types';
import * as db from '../services/db';

interface TransactionStore {
  // State
  transactions: Transaction[];
  loading: boolean;
  currentMonth: string; // YYYY-MM format
  
  // Actions
  loadTransactions: () => Promise<void>;
  loadTransactionsByMonth: (month: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: number, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  setCurrentMonth: (month: string) => void;
  
  // Analytics
  getMonthlyTotal: () => number;
  getCategorySpending: () => CategorySpending[];
  getDailySpending: () => Promise<DailySpending[]>;
  getTopMerchants: (limit?: number) => Promise<MerchantSpending[]>;
  getRecentTransactions: (limit?: number) => Transaction[];
  
  // Utility
  resetAllData: () => Promise<void>;
  getTransactionCount: () => number;
}

/**
 * Get current month in YYYY-MM format
 */
const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  // Initial state
  transactions: [],
  loading: false,
  currentMonth: getCurrentMonth(),

  /**
   * Load all transactions from database
   */
  loadTransactions: async () => {
    set({ loading: true });
    try {
      const transactions = await db.getAllTransactions();
      set({ transactions, loading: false });
    } catch (error) {
      console.error('Error loading transactions:', error);
      set({ loading: false });
    }
  },

  /**
   * Load transactions for a specific month
   */
  loadTransactionsByMonth: async (month: string) => {
    set({ loading: true, currentMonth: month });
    try {
      const transactions = await db.getTransactionsByMonth(month);
      set({ transactions, loading: false });
    } catch (error) {
      console.error('Error loading monthly transactions:', error);
      set({ loading: false });
    }
  },

  /**
   * Add a new transaction
   */
  addTransaction: async (transaction: Transaction) => {
    try {
      const id = await db.insertTransaction(transaction);
      const newTransaction = { ...transaction, id };
      
      // Add to current state
      set((state) => ({
        transactions: [newTransaction, ...state.transactions],
      }));
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  /**
   * Update an existing transaction
   */
  updateTransaction: async (id: number, updates: Partial<Transaction>) => {
    try {
      await db.updateTransaction(id, updates);
      
      // Update in current state
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }));
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  /**
   * Delete a transaction
   */
  deleteTransaction: async (id: number) => {
    try {
      await db.deleteTransaction(id);
      
      // Remove from current state
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  /**
   * Refresh transactions from database
   */
  refreshTransactions: async () => {
    const { currentMonth, loadTransactionsByMonth } = get();
    await loadTransactionsByMonth(currentMonth);
  },

  /**
   * Set current month filter
   */
  setCurrentMonth: (month: string) => {
    set({ currentMonth: month });
    get().loadTransactionsByMonth(month);
  },

  /**
   * Get total spending for current month
   */
  getMonthlyTotal: () => {
    const { transactions } = get();
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  },

  /**
   * Get category-wise spending breakdown
   */
  getCategorySpending: () => {
    const { transactions } = get();
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    const categoryMap = new Map<TransactionCategory, { amount: number; count: number }>();
    
    transactions.forEach((t) => {
      const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
      categoryMap.set(t.category, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      });
    });
    
    const categorySpending: CategorySpending[] = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        count: data.count,
      })
    );
    
    // Sort by amount descending
    return categorySpending.sort((a, b) => b.amount - a.amount);
  },

  /**
   * Get daily spending for current month
   */
  getDailySpending: async () => {
    const { currentMonth } = get();
    try {
      const dailyData = await db.getDailySpending(currentMonth);
      return dailyData.map((d) => ({
        date: d.date,
        amount: d.amount,
      }));
    } catch (error) {
      console.error('Error getting daily spending:', error);
      return [];
    }
  },

  /**
   * Get top merchants by spending
   */
  getTopMerchants: async (limit: number = 5) => {
    const { currentMonth } = get();
    try {
      const merchants = await db.getTopMerchants(currentMonth, limit);
      return merchants.map((m) => ({
        merchant: m.merchant,
        totalAmount: m.totalAmount,
        transactionCount: m.transactionCount,
      }));
    } catch (error) {
      console.error('Error getting top merchants:', error);
      return [];
    }
  },

  /**
   * Get recent transactions
   */
  getRecentTransactions: (limit: number = 10) => {
    const { transactions } = get();
    return transactions.slice(0, limit);
  },

  /**
   * Reset all data (delete all transactions)
   */
  resetAllData: async () => {
    try {
      await db.deleteAllTransactions();
      set({ transactions: [] });
    } catch (error) {
      console.error('Error resetting data:', error);
      throw error;
    }
  },

  /**
   * Get total transaction count
   */
  getTransactionCount: () => {
    const { transactions } = get();
    return transactions.length;
  },
}));
