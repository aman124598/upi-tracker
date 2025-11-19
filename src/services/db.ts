/**
 * Local AsyncStorage-backed database
 * 
 * This provides a persistent local storage solution that works in Expo Go
 * without requiring native modules or a remote backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { Transaction, TransactionFilter, DailySpending, MerchantSpending } from '../types';

const STORAGE_KEY = '@upi_tracker_transactions';

// Firebase sync (lazy import to avoid circular dependencies)
let uploadTransaction: ((transaction: Transaction, userId?: string) => Promise<void>) | null = null;
const getUploadFunction = async () => {
  if (!uploadTransaction) {
    try {
      const syncService = await import('./syncService');
      uploadTransaction = syncService.uploadTransaction;
    } catch (error) {
      console.warn('Firebase sync not available:', error);
      uploadTransaction = async () => {}; // No-op if Firebase not set up
    }
  }
  return uploadTransaction;
};

let transactionsCache: Transaction[] = [];
let nextId = 1;
type ChangeEvent = {
  action: 'insert' | 'update' | 'delete' | 'reset';
  data?: any;
};

type ChangeCallback = (ev: ChangeEvent) => void;
let listeners: ChangeCallback[] = [];

export const addChangeListener = (cb: ChangeCallback) => {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
};

const emitChange = (ev: ChangeEvent) => {
  listeners.forEach((cb) => {
    try {
      cb(ev);
    } catch (err) {
      console.error('Error in DB change listener:', err);
    }
  });
};

export const loadTransactions = async (): Promise<Transaction[]> => {
  // Prefer native SQLite (so native SMS receiver entries are visible)
  try {
    const db = SQLite.openDatabase('upi_tracker.db');
    const rows: Transaction[] = await new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL, merchant TEXT, category TEXT, date TEXT, source TEXT, upiRef TEXT, rawMessage TEXT, createdAt TEXT)`
        );
        tx.executeSql(
          `SELECT id, amount, merchant, category, date, source, upiRef, rawMessage, createdAt FROM transactions ORDER BY date DESC`,
          [],
          (_, result) => {
            const items: Transaction[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const r: any = result.rows.item(i);
              items.push({
                id: r.id,
                amount: r.amount,
                merchant: r.merchant || 'Unknown',
                category: r.category || 'Uncategorized',
                date: r.date || r.createdAt || new Date().toISOString(),
                source: r.source || 'sms',
                upiRef: r.upiRef || undefined,
                rawMessage: r.rawMessage || undefined,
                createdAt: r.createdAt || new Date().toISOString(),
              });
            }
            resolve(items);
          },
          (_, err) => {
            reject(err);
            return false;
          }
        );
      }, (e) => reject(e));
    });

    transactionsCache = rows;
    if (transactionsCache.length > 0) {
      nextId = Math.max(...transactionsCache.map(t => t.id || 0)) + 1;
    }
    return transactionsCache;
  } catch (error) {
    // Fallback to AsyncStorage if SQLite is unavailable
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        transactionsCache = JSON.parse(data);
        if (transactionsCache.length > 0) {
          nextId = Math.max(...transactionsCache.map(t => t.id || 0)) + 1;
        }
      }
      return transactionsCache;
    } catch (err) {
      console.error('Error loading transactions (both SQLite and AsyncStorage):', err);
      return [];
    }
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
  // Ensure SQLite table exists and load
  await loadTransactions();
  console.log('✅ Local database initialized (SQLite fallback to AsyncStorage)');
  
  // Migrate and categorize unlabelled rows from native inserts
  await migrateAndCategorizeRows();
};

/**
 * Migrate native-inserted rows that have null/empty category
 * Runs categorization on them so dashboard shows proper categories
 */
export const migrateAndCategorizeRows = async (): Promise<void> => {
  try {
    const db = SQLite.openDatabase('upi_tracker.db');
    // Import categorizer
    const { categorizeTransaction } = await import('./categorizer');
    
    await new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        // Find rows with null or 'Uncategorized' category
        tx.executeSql(
          `SELECT id, merchant FROM transactions WHERE category IS NULL OR category = 'Uncategorized' OR category = ''`,
          [],
          (_, result) => {
            const updates: Array<{ id: number; category: string }> = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row: any = result.rows.item(i);
              const category = categorizeTransaction(row.merchant || 'Unknown');
              updates.push({ id: row.id, category });
            }
            
            // Apply categorization updates
            updates.forEach(({ id, category }) => {
              tx.executeSql(
                `UPDATE transactions SET category = ? WHERE id = ?`,
                [category, id],
                () => {},
                (_, err) => {
                  console.warn('Failed to update category for row', id, err);
                  return false;
                }
              );
            });
            
            if (updates.length > 0) {
              console.log(`✅ Categorized ${updates.length} unlabelled transactions`);
            }
            resolve();
          },
          (_, err) => {
            reject(err);
            return false;
          }
        );
      }, (e) => reject(e));
    });
  } catch (err) {
    console.warn('Migration/categorization skipped (SQLite not available or error):', err);
  }
};

export const insertTransaction = async (transaction: Transaction): Promise<number> => {
  // Insert into SQLite (so native receiver or background insertions appear)
  try {
    const db = SQLite.openDatabase('upi_tracker.db');
    const createdAt = transaction.createdAt || new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL, merchant TEXT, category TEXT, date TEXT, source TEXT, upiRef TEXT, rawMessage TEXT, createdAt TEXT)`
        );
        tx.executeSql(
          `INSERT INTO transactions (amount, merchant, category, date, source, upiRef, rawMessage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [transaction.amount, transaction.merchant, transaction.category || null, transaction.date || createdAt, transaction.source || 'manual', transaction.upiRef || null, transaction.rawMessage || null, createdAt],
          (_, result) => {
            // SQLite rowId
            const rowId = (result as any).insertId || (result as any).insertId === 0 ? (result as any).insertId : undefined;
            resolve();
          },
          (_, err) => { reject(err); return false; }
        );
      }, (e) => reject(e));
    });

    // Refresh cache by loading transactions again
    const all = await loadTransactions();
    emitChange({ action: 'insert', data: transaction });
    
    // Auto-sync to Firebase (fire and forget)
    getUploadFunction().then(upload => {
      upload(transaction).catch(err => 
        console.warn('Firebase upload skipped:', err)
      );
    });
    
    return transaction.id || nextId++;
  } catch (err) {
    // Fallback to AsyncStorage
    const transactions = await loadTransactions();
    const id = nextId++;
    const newTransaction = {
      ...transaction,
      id,
      createdAt: transaction.createdAt || new Date().toISOString(),
    };
    transactions.push(newTransaction);
    
    // Auto-sync to Firebase
    getUploadFunction().then(upload => {
      upload(newTransaction).catch(err => 
        console.warn('Firebase upload skipped:', err)
      );
    });
    await saveTransactions(transactions);
    emitChange({ action: 'insert', data: newTransaction });
    return id;
  }
};

export const updateTransaction = async (id: number, updates: Partial<Transaction>): Promise<void> => {
  try {
    const db = SQLite.openDatabase('upi_tracker.db');
    await new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        const fields: string[] = [];
        const values: any[] = [];
        if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
        if (updates.merchant !== undefined) { fields.push('merchant = ?'); values.push(updates.merchant); }
        if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
        if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
        if (updates.source !== undefined) { fields.push('source = ?'); values.push(updates.source); }
        if (updates.upiRef !== undefined) { fields.push('upiRef = ?'); values.push(updates.upiRef); }
        if (updates.rawMessage !== undefined) { fields.push('rawMessage = ?'); values.push(updates.rawMessage); }
        if (fields.length === 0) { resolve(); return; }
        values.push(id);
        const sql = `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`;
        tx.executeSql(sql, values, () => resolve(), (_, err) => { reject(err); return false; });
      }, (e) => reject(e));
    });
    
    // Get updated transaction and sync to Firebase
    const allTransactions = await loadTransactions();
    const updatedTransaction = allTransactions.find(t => t.id === id);
    if (updatedTransaction) {
      getUploadFunction().then(upload => {
        upload(updatedTransaction).catch(err => 
          console.warn('Firebase upload skipped:', err)
        );
      });
    }
    
    emitChange({ action: 'update', data: { id, updates } });
  } catch (err) {
    // Fallback to AsyncStorage update
    const transactions = await loadTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      await saveTransactions(transactions);
      
      // Sync updated transaction to Firebase
      getUploadFunction().then(upload => {
        upload(transactions[index]).catch(err => 
          console.warn('Firebase upload skipped:', err)
        );
      });
      
      emitChange({ action: 'update', data: { id, updates } });
    }
  }
};

export const deleteTransaction = async (id: number): Promise<void> => {
  try {
    const db = SQLite.openDatabase('upi_tracker.db');
    await new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(`DELETE FROM transactions WHERE id = ?`, [id], () => resolve(), (_, err) => { reject(err); return false; });
      }, (e) => reject(e));
    });
    emitChange({ action: 'delete', data: { id } });
  } catch (err) {
    const transactions = await loadTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await saveTransactions(filtered);
    emitChange({ action: 'delete', data: { id } });
  }
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
  emitChange({ action: 'reset' });
};

export const getMonthlyStats = async (month: string) => {
  const transactions = await getTransactionsByMonth(month);
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const count = transactions.length;
  const average = count > 0 ? total / count : 0;
  return { total, count, average };
};

