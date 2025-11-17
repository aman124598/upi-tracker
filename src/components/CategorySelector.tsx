/**
 * Category Selector Component
 * Allows users to select a transaction category
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { TransactionCategory } from '../types';
import { getCategoryColor } from '../utils/helpers';

interface CategorySelectorProps {
  selectedCategory: TransactionCategory;
  onSelect: (category: TransactionCategory) => void;
}

const categories: TransactionCategory[] = [
  'Food',
  'Shopping',
  'Bills',
  'Travel',
  'Groceries',
  'Recharge',
  'Entertainment',
  'Healthcare',
  'Others',
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = category === selectedCategory;
          const categoryColor = getCategoryColor(category);

          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                isSelected && {
                  backgroundColor: categoryColor,
                  borderColor: categoryColor,
                },
              ]}
              onPress={() => onSelect(category)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
});
