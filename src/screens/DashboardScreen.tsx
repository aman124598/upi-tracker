/**
 * Dashboard Screen
 * Displays analytics, charts, and spending insights
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTransactionStore } from '../store/transactionStore';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { SpendingTrendChart } from '../components/SpendingTrendChart';
import { TopMerchants } from '../components/TopMerchants';
import { getMonthName, getCurrentMonth, getPreviousMonth, getNextMonth } from '../utils/helpers';

export const DashboardScreen = () => {
  const {
    currentMonth,
    setCurrentMonth,
    getCategorySpending,
    getDailySpending,
    getTopMerchants,
  } = useTransactionStore();

  const [dailyData, setDailyData] = useState<any[]>([]);
  const [topMerchants, setTopMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const daily = await getDailySpending();
      const merchants = await getTopMerchants(5);
      setDailyData(daily);
      setTopMerchants(merchants);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [currentMonth]);

  const categorySpending = getCategorySpending();

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    const nextMonth = getNextMonth(currentMonth);
    const current = getCurrentMonth();
    // Don't allow going beyond current month
    if (nextMonth <= current) {
      setCurrentMonth(nextMonth);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadAnalytics} />
      }
    >
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthButton}
          onPress={handlePreviousMonth}
        >
          <Text style={styles.monthButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.monthText}>{getMonthName(currentMonth)}</Text>

        <TouchableOpacity
          style={[
            styles.monthButton,
            getNextMonth(currentMonth) > getCurrentMonth() && styles.monthButtonDisabled,
          ]}
          onPress={handleNextMonth}
          disabled={getNextMonth(currentMonth) > getCurrentMonth()}
        >
          <Text style={styles.monthButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Category Distribution */}
      <CategoryPieChart data={categorySpending} />

      {/* Spending Trend */}
      <SpendingTrendChart data={dailyData} />

      {/* Top Merchants */}
      <TopMerchants merchants={topMerchants} />

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonDisabled: {
    opacity: 0.3,
  },
  monthButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  bottomPadding: {
    height: 24,
  },
});
