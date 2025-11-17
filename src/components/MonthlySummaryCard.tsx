/**
 * Monthly Summary Card Component
 * Displays total monthly spending and transaction count
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { formatCurrency } from '../utils/helpers';

interface MonthlySummaryCardProps {
  totalSpent: number;
  transactionCount: number;
  month: string;
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({
  totalSpent,
  transactionCount,
  month,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Icon name="wallet" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.monthLabel}>{month}</Text>
      </View>
      <Text style={styles.totalAmount}>{formatCurrency(totalSpent)}</Text>
      <View style={styles.footer}>
        <Icon name="receipt" size={16} color="#DBEAFE" />
        <Text style={styles.transactionCount}>
          {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  monthLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCount: {
    fontSize: 14,
    color: '#DBEAFE',
    marginLeft: 6,
  },
});
