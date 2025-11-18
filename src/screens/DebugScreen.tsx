/**
 * Debug Screen
 * Test SMS parsing and transaction detection
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
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { parseSMS } from '../services/parser';
import { categorizeTransaction } from '../services/categorizer';
import { insertTransaction } from '../services/db';
import { useTransactionStore } from '../store/transactionStore';
import { Transaction } from '../types';

export const DebugScreen = () => {
  const [smsText, setSmsText] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { refreshTransactions } = useTransactionStore();

  // Sample SMS messages for quick testing
  const sampleMessages = [
    'Rs 450.00 debited from A/C XX1234 on 15-Nov-24 to VPA zomato@paytm via UPI. Ref 433847362847. -SBI',
    'You have paid Rs.1200 to Swiggy via Google Pay. UPI Ref No: 434958473829',
    'Your A/C XX5678 is debited with Rs.2500.00 on 16-Nov-24. Paid to FLIPKART via PhonePe. Ref: 837463829471',
    'INR 89.00 debited from your account for Mobile Recharge - Jio via BHIM UPI. Ref: 123456789012',
    'Rs.3500 transferred to Uber India via GPay on 17-Nov-24. UPI Ref: 938475839201',
    'Payment of Rs 750.50 made to BigBasket via PhonePe. Transaction ID: 847362940183',
  ];

  const handleParseSMS = () => {
    if (!smsText.trim()) {
      Alert.alert('Error', 'Please enter SMS text to parse');
      return;
    }

    const result = parseSMS(smsText);
    
    if (result) {
      const category = categorizeTransaction(result.merchant);
      setParsedResult({ ...result, category });
    } else {
      setParsedResult({ error: 'Could not parse as UPI transaction' });
    }
  };

  const handleAddTransaction = async () => {
    if (!parsedResult || parsedResult.error) {
      Alert.alert('Error', 'Please parse a valid SMS first');
      return;
    }

    setLoading(true);
    try {
      const transaction: Transaction = {
        amount: parsedResult.amount,
        merchant: parsedResult.merchant,
        category: parsedResult.category || 'Uncategorized',
        date: parsedResult.date || new Date().toISOString(),
        source: parsedResult.source || 'sms',
        upiRef: parsedResult.upiRef,
        rawMessage: parsedResult.rawMessage,
      };

      await insertTransaction(transaction);
      await refreshTransactions();
      
      Alert.alert('Success', 'Transaction added successfully!');
      setSmsText('');
      setParsedResult(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample: string) => {
    setSmsText(sample);
    setParsedResult(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="bug" size={40} color="#3B82F6" />
        <Text style={styles.title}>SMS Parser Debug</Text>
        <Text style={styles.subtitle}>Test transaction detection</Text>
      </View>

      {/* SMS Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SMS Message</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste SMS text here..."
          value={smsText}
          onChangeText={setSmsText}
          multiline
          numberOfLines={4}
        />
        
        <TouchableOpacity
          style={styles.parseButton}
          onPress={handleParseSMS}
        >
          <Icon name="magnify" size={20} color="#fff" />
          <Text style={styles.parseButtonText}>Parse SMS</Text>
        </TouchableOpacity>
      </View>

      {/* Sample Messages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sample Messages (Tap to Load)</Text>
        {sampleMessages.map((sample, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sampleCard}
            onPress={() => loadSample(sample)}
          >
            <Icon name="message-text" size={16} color="#6B7280" />
            <Text style={styles.sampleText} numberOfLines={2}>
              {sample}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parsed Result */}
      {parsedResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parsed Result</Text>
          
          {parsedResult.error ? (
            <View style={styles.errorCard}>
              <Icon name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.errorText}>{parsedResult.error}</Text>
            </View>
          ) : (
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Amount:</Text>
                <Text style={styles.resultValue}>₹{parsedResult.amount}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Merchant:</Text>
                <Text style={styles.resultValue}>{parsedResult.merchant}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Category:</Text>
                <Text style={styles.resultValue}>{parsedResult.category}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Source:</Text>
                <Text style={styles.resultValue}>{parsedResult.source}</Text>
              </View>
              
              {parsedResult.upiRef && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>UPI Ref:</Text>
                  <Text style={styles.resultValueSmall}>{parsedResult.upiRef}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddTransaction}
                disabled={loading}
              >
                <Icon name="plus-circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>
                  {loading ? 'Adding...' : 'Add to Transactions'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Use</Text>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>
            1. Copy a UPI transaction SMS from your messages{'\n'}
            2. Paste it in the text box above{'\n'}
            3. Tap "Parse SMS" to test detection{'\n'}
            4. If successful, tap "Add to Transactions"{'\n'}
            5. Or use sample messages for quick testing
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  parseButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  parseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  sampleText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  resultCard: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  resultValueSmall: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  instructionCard: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  instructionText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 22,
  },
});
