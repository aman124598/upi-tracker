/**
 * Spending Trend Chart Component
 * Displays daily spending trends as a line chart
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { DailySpending } from '../types';
import { formatCurrencyShort, formatDateShort } from '../utils/helpers';

interface SpendingTrendChartProps {
  data: DailySpending[];
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No spending trends available</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  // Prepare chart data (limit to last 15 days for better visibility)
  const limitedData = data.slice(-15);
  const labels = limitedData.map((item) => {
    const date = new Date(item.date);
    return date.getDate().toString();
  });
  const amounts = limitedData.map((item) => item.amount);

  const chartData = {
    labels,
    datasets: [
      {
        data: amounts,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Spending Trend</Text>
      
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#3B82F6',
          },
        }}
        bezier
        style={styles.chart}
        formatYLabel={(value) => formatCurrencyShort(parseFloat(value))}
      />
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
