/**
 * Pie Chart Component
 * Displays category-wise spending distribution
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { CategorySpending } from '../types';
import { formatCurrency, getCategoryColor } from '../utils/helpers';

interface CategoryPieChartProps {
  data: CategorySpending[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No spending data available</Text>
      </View>
    );
  }

  // Prepare chart data
  const chartData = data.map((item) => ({
    name: item.category,
    amount: item.amount,
    color: getCategoryColor(item.category),
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category Distribution</Text>
      
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 0]}
        absolute
      />

      {/* Legend */}
      <View style={styles.legend}>
        {data.slice(0, 5).map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: getCategoryColor(item.category) },
              ]}
            />
            <Text style={styles.legendText}>{item.category}</Text>
            <Text style={styles.legendAmount}>
              {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>
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
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  legend: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  legendAmount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});
