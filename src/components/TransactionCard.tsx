/**
 * Transaction Card Component
 * Displays a single transaction in a card format
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Transaction } from '../types';
import { formatCurrency, formatDate, formatTime, getCategoryColor, getCategoryIcon } from '../utils/helpers';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
}) => {
  const categoryColor = getCategoryColor(transaction.category);
  const categoryIcon = getCategoryIcon(transaction.category);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category icon */}
      <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '20' }]}>
        <Icon name={categoryIcon} size={24} color={categoryColor} />
      </View>

      <View style={styles.content}>
        {/* Merchant name and category */}
        <View style={styles.header}>
          <Text style={styles.merchant} numberOfLines={1}>
            {transaction.merchant}
          </Text>
          <Text style={styles.amount}>{formatCurrency(transaction.amount)}</Text>
        </View>

        {/* Date and category */}
        <View style={styles.footer}>
          <View style={styles.leftSection}>
            <Icon name="tag" size={12} color="#9CA3AF" style={styles.smallIcon} />
            <Text style={styles.category}>{transaction.category}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.source}>{transaction.source}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Icon name="clock-outline" size={11} color="#9CA3AF" style={styles.smallIcon} />
            <Text style={styles.date}>
              {formatDate(transaction.date)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  smallIcon: {
    marginRight: 4,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  separator: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  source: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
