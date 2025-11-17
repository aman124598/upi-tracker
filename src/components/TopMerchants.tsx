/**
 * Top Merchants Component
 * Displays a list of top merchants by spending
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MerchantSpending } from '../types';
import { formatCurrency } from '../utils/helpers';

interface TopMerchantsProps {
  merchants: MerchantSpending[];
}

export const TopMerchants: React.FC<TopMerchantsProps> = ({ merchants }) => {
  if (!merchants || merchants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No merchant data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Merchants</Text>
      
      {merchants.map((merchant, index) => (
        <View key={index} style={styles.merchantRow}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          
          <View style={styles.merchantInfo}>
            <Text style={styles.merchantName} numberOfLines={1}>
              {merchant.merchant}
            </Text>
            <Text style={styles.transactionCount}>
              {merchant.transactionCount} {merchant.transactionCount === 1 ? 'transaction' : 'transactions'}
            </Text>
          </View>
          
          <Text style={styles.amount}>
            {formatCurrency(merchant.totalAmount)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 8,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
