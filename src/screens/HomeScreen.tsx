/**
 * Home Screen
 * Displays monthly summary and recent transactions
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTransactionStore } from '../store/transactionStore';
import { MonthlySummaryCard } from '../components/MonthlySummaryCard';
import { TransactionCard } from '../components/TransactionCard';
import { getMonthName, getCurrentMonth } from '../utils/helpers';

export const HomeScreen = () => {
  const {
    transactions,
    loading,
    currentMonth,
    loadTransactionsByMonth,
    getMonthlyTotal,
    getTransactionCount,
  } = useTransactionStore();

  useEffect(() => {
    // Load current month data on mount
    loadTransactionsByMonth(getCurrentMonth());
  }, []);

  const handleRefresh = () => {
    loadTransactionsByMonth(currentMonth);
  };

  const monthlyTotal = getMonthlyTotal();
  const transactionCount = getTransactionCount();
  const recentTransactions = transactions.slice(0, 10);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
      }
    >
      {/* Monthly Summary */}
      <MonthlySummaryCard
        totalSpent={monthlyTotal}
        transactionCount={transactionCount}
        month={getMonthName(currentMonth)}
      />

      {/* Recent Transactions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length > 10 && (
            <Text style={styles.seeAll}>See All</Text>
          )}
        </View>

        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="wallet-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Add transactions manually or import from SMS
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 24,
  },
});
