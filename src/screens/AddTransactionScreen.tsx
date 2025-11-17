/**
 * Add Transaction Screen
 * Manual transaction entry form
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTransactionStore } from '../store/transactionStore';
import { CategorySelector } from '../components/CategorySelector';
import { TransactionCategory, TransactionSource } from '../types';
import { categorizeTransaction } from '../services/categorizer';
import { formatDateForDB, validateAmount, sanitizeMerchantName } from '../utils/helpers';

const sources: TransactionSource[] = ['Manual', 'GPay', 'PhonePe', 'Paytm', 'BHIM', 'Bank'];

export const AddTransactionScreen = ({ navigation }: any) => {
  const { addTransaction } = useTransactionStore();

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Others');
  const [source, setSource] = useState<TransactionSource>('Manual');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-categorize when merchant changes
  const handleMerchantChange = (text: string) => {
    setMerchant(text);
    if (text.length > 2) {
      const suggestedCategory = categorizeTransaction(text);
      setCategory(suggestedCategory);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!merchant.trim()) {
      Alert.alert('Error', 'Please enter merchant name');
      return;
    }

    if (!amount.trim() || !validateAmount(amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      const transaction = {
        amount: parseFloat(amount),
        merchant: sanitizeMerchantName(merchant),
        category,
        source,
        date: formatDateForDB(date),
      };

      await addTransaction(transaction);
      
      Alert.alert('Success', 'Transaction added successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setAmount('');
            setMerchant('');
            setCategory('Others');
            setSource('Manual');
            setDate(new Date());
            
            // Navigate back
            if (navigation?.goBack) {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Amount Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Merchant Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Merchant / Payee *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Zomato, Amazon, etc."
            value={merchant}
            onChangeText={handleMerchantChange}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Category Selector */}
        <View style={styles.field}>
          <CategorySelector
            selectedCategory={category}
            onSelect={setCategory}
          />
        </View>

        {/* Source Selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Payment Source</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sourceScroll}
          >
            {sources.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sourceButton,
                  source === s && styles.sourceButtonActive,
                ]}
                onPress={() => setSource(s)}
              >
                <Text
                  style={[
                    styles.sourceText,
                    source === s && styles.sourceTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Date Picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar" size={20} color="#6B7280" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Icon name="loading" size={20} color="#FFFFFF" style={styles.loadingIcon} />
          ) : (
            <Icon name="check-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          )}
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Add Transaction'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    height: 50,
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  sourceScroll: {
    paddingVertical: 4,
  },
  sourceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  sourceButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sourceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  sourceTextActive: {
    color: '#FFFFFF',
  },
  dateButton: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 12,
  },
  saveButton: {
    height: 52,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loadingIcon: {
    marginRight: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
