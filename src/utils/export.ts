/**
 * CSV Export Utility
 * Exports transaction data to CSV file
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction } from '../types';
import { formatDate, formatCurrency } from './helpers';

/**
 * Convert transactions to CSV format
 */
const convertToCSV = (transactions: Transaction[]): string => {
  // CSV header
  const header = 'Date,Amount,Merchant,Category,Source,UPI Ref,Raw Message\n';
  
  // CSV rows
  const rows = transactions.map((t) => {
    const date = formatDate(t.date);
    const amount = t.amount.toFixed(2);
    const merchant = `"${t.merchant.replace(/"/g, '""')}"`;
    const category = t.category;
    const source = t.source;
    const upiRef = t.upiRef ? `"${t.upiRef}"` : '';
    const rawMessage = t.rawMessage ? `"${t.rawMessage.replace(/"/g, '""')}"` : '';
    
    return `${date},${amount},${merchant},${category},${source},${upiRef},${rawMessage}`;
  }).join('\n');
  
  return header + rows;
};

/**
 * Export transactions to CSV file
 */
export const exportToCSV = async (
  transactions: Transaction[],
  filename?: string
): Promise<boolean> => {
  try {
    // Generate filename with current date
    const date = new Date();
    const dateStr = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const csvFilename = filename || `upi_spends_${dateStr}.csv`;
    
    // Convert to CSV
    const csvContent = convertToCSV(transactions);
    
    // Create file path
    const fileUri = `${FileSystem.documentDirectory}${csvFilename}`;
    
    // Write to file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    console.log('✅ CSV file created:', fileUri);
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export UPI Transactions',
      });
      console.log('✅ CSV file shared');
      return true;
    } else {
      console.log('⚠️ Sharing not available on this device');
      return false;
    }
  } catch (error) {
    console.error('❌ Error exporting CSV:', error);
    return false;
  }
};

/**
 * Export monthly summary to CSV
 */
export const exportMonthlySummary = async (
  transactions: Transaction[],
  month: string
): Promise<boolean> => {
  try {
    const monthName = month.replace('-', '_');
    return await exportToCSV(transactions, `upi_spends_${monthName}.csv`);
  } catch (error) {
    console.error('❌ Error exporting monthly summary:', error);
    return false;
  }
};

/**
 * Create a simple text summary
 */
export const createTextSummary = (transactions: Transaction[], month: string): string => {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const count = transactions.length;
  
  let summary = `UPI Spend Tracker - ${month}\n`;
  summary += `${'='.repeat(40)}\n\n`;
  summary += `Total Transactions: ${count}\n`;
  summary += `Total Spending: ${formatCurrency(total)}\n\n`;
  summary += `Recent Transactions:\n`;
  summary += `${'-'.repeat(40)}\n`;
  
  transactions.slice(0, 10).forEach((t) => {
    summary += `${formatDate(t.date)} | ${formatCurrency(t.amount)} | ${t.merchant}\n`;
  });
  
  return summary;
};
