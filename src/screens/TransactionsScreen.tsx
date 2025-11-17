/**
 * Transactions Screen
 * View, search, filter, and sort all transactions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTransactionStore } from '../store/transactionStore';
import { TransactionCard } from '../components/TransactionCard';
import { useFilteredTransactions } from '../hooks';
import { TransactionCategory } from '../types';
import { getAllCategories } from '../services/categorizer';

export const TransactionsScreen = () => {
  const { transactions } = useTransactionStore();
  const {
    filtered,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    clearFilters,
  } = useFilteredTransactions();

  const [showFilters, setShowFilters] = useState(false);
  const categories = getAllCategories();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#9CA3AF"
        />
        {(searchTerm || selectedCategory) && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearFilters}
          >
            <Icon name="close-circle" size={20} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterHeader}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon name={showFilters ? "filter-off" : "filter"} size={18} color="#3B82F6" style={styles.filterIcon} />
          <Text style={styles.filterButtonText}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </Text>
      </View>

      {/* Category Filters */}
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilters}
          contentContainerStyle={styles.categoryFiltersContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryFilterButton,
              !selectedCategory && styles.categoryFilterButtonActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryFilterText,
                !selectedCategory && styles.categoryFilterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilterButton,
                selectedCategory === category && styles.categoryFilterButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === category && styles.categoryFilterTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Transactions List */}
      {filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="file-search-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your filters
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    position: 'absolute',
    left: 28,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 15,
    color: '#1F2937',
  },
  clearButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  resultCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoryFilters: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryFilterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
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
});
