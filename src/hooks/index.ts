/**
 * Custom React Hooks
 * Reusable hooks for common operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { Transaction } from '../types';
import { getCurrentMonth } from '../utils/helpers';

/**
 * Hook to manage monthly data loading
 */
export const useMonthlyData = (month?: string) => {
  const currentMonth = month || getCurrentMonth();
  const { loadTransactionsByMonth, transactions, loading } = useTransactionStore();

  useEffect(() => {
    loadTransactionsByMonth(currentMonth);
  }, [currentMonth]);

  return { transactions, loading, currentMonth };
};

/**
 * Hook to manage filtered transactions
 */
export const useFilteredTransactions = () => {
  const { transactions } = useTransactionStore();
  const [filtered, setFiltered] = useState<Transaction[]>(transactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    let result = [...transactions];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.merchant.toLowerCase().includes(term) ||
          t.amount.toString().includes(term) ||
          t.category.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((t) => t.category === selectedCategory);
    }

    setFiltered(result);
  }, [transactions, searchTerm, selectedCategory]);

  return {
    filtered,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    clearFilters: () => {
      setSearchTerm('');
      setSelectedCategory(null);
    },
  };
};

/**
 * Hook to manage analytics data
 */
export const useAnalytics = () => {
  const {
    getMonthlyTotal,
    getCategorySpending,
    getDailySpending,
    getTopMerchants,
  } = useTransactionStore();

  const [dailyData, setDailyData] = useState<any[]>([]);
  const [topMerchants, setTopMerchants] = useState<any[]>([]);

  const loadAnalytics = useCallback(async () => {
    const daily = await getDailySpending();
    const merchants = await getTopMerchants(5);
    setDailyData(daily);
    setTopMerchants(merchants);
  }, [getDailySpending, getTopMerchants]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    monthlyTotal: getMonthlyTotal(),
    categorySpending: getCategorySpending(),
    dailySpending: dailyData,
    topMerchants,
    refreshAnalytics: loadAnalytics,
  };
};

/**
 * Hook for debounced value (useful for search)
 */
export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook to manage form state
 */
export const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  const validate = (validationRules: Partial<Record<keyof T, (value: any) => string | undefined>>) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const validator = validationRules[key as keyof T];
      if (validator) {
        const error = validator(values[key as keyof T]);
        if (error) {
          newErrors[key as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  return {
    values,
    errors,
    handleChange,
    reset,
    validate,
    setValues,
  };
};
