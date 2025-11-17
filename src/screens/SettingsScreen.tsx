/**
 * Settings Screen
 * App settings, export, import, and data management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTransactionStore } from '../store/transactionStore';
import { exportToCSV } from '../utils/export';
import { 
  importSampleTransactions, 
  requestSMSPermission, 
  checkSMSPermission,
  startSMSMonitoring,
  stopSMSMonitoring 
} from '../services/smsReader';
import { initDatabase, getTransactionCount } from '../services/db';

export const SettingsScreen = () => {
  const { transactions, resetAllData, refreshTransactions } = useTransactionStore();
  const [loading, setLoading] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  // Check SMS permission status on mount
  useEffect(() => {
    checkSMSStatus();
  }, []);

  const checkSMSStatus = async () => {
    const hasPermission = await checkSMSPermission();
    setSmsEnabled(hasPermission);
  };

  // Handle CSV Export
  const handleExport = async () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'No transactions to export');
      return;
    }

    setLoading(true);
    try {
      const success = await exportToCSV(transactions);
      if (success) {
        Alert.alert('Success', 'Transactions exported successfully');
      } else {
        Alert.alert('Error', 'Failed to export transactions');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export transactions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Import Sample Data
  const handleImportSample = async () => {
    Alert.alert(
      'Import Sample Data',
      'This will add sample transactions for testing. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setLoading(true);
            try {
              const count = await importSampleTransactions();
              await refreshTransactions();
              Alert.alert('Success', `Imported ${count} sample transactions`);
            } catch (error) {
              Alert.alert('Error', 'Failed to import sample data');
              console.error(error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle SMS Permission
  const handleRequestSMSPermission = async () => {
    setLoading(true);
    try {
      const granted = await requestSMSPermission();
      if (granted) {
        // Start monitoring automatically
        const started = await startSMSMonitoring();
        if (started) {
          setSmsEnabled(true);
          Alert.alert(
            'SMS Monitoring Enabled',
            'The app will now automatically detect UPI transactions from your SMS messages.'
          );
        } else {
          Alert.alert('Error', 'Failed to start SMS monitoring');
        }
      } else {
        setSmsEnabled(false);
        Alert.alert('Permission Denied', 'SMS permission was not granted');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permission');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle SMS Monitoring
  const handleToggleSMSMonitoring = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestSMSPermission();
      if (granted) {
        const started = await startSMSMonitoring();
        setSmsEnabled(started);
        if (started) {
          Alert.alert('Enabled', 'Automatic transaction detection is now active');
        }
      }
    } else {
      stopSMSMonitoring();
      setSmsEnabled(false);
      Alert.alert('Disabled', 'Automatic transaction detection stopped');
    }
  };

  // Handle Reset Data
  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all transactions permanently. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await resetAllData();
              Alert.alert('Success', 'All data has been reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data');
              console.error(error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle Database Initialization
  const handleInitDB = async () => {
    setLoading(true);
    try {
      await initDatabase();
      const count = await getTransactionCount();
      Alert.alert('Database Initialized', `Current transactions: ${count}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize database');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Auto SMS Detection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="message-text" size={24} color="#6366f1" />
          <Text style={styles.sectionTitle}>Auto Transaction Detection</Text>
        </View>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => handleToggleSMSMonitoring(!smsEnabled)}
        >
          <View style={styles.settingLeft}>
            <Icon name="cellphone-message" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>SMS Auto-Detection</Text>
              <Text style={styles.settingSubtitle}>
                {smsEnabled
                  ? 'Automatically reading UPI transaction SMS'
                  : 'Enable to auto-detect transactions'}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusIndicator,
              smsEnabled ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                smsEnabled ? styles.statusActiveText : styles.statusInactiveText,
              ]}
            >
              {smsEnabled ? 'ACTIVE' : 'OFF'}
            </Text>
          </View>
        </TouchableOpacity>
        {!smsEnabled && (
          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleRequestSMSPermission}
          >
            <Icon name="shield-check" size={20} color="#fff" />
            <Text style={styles.enableButtonText}>Enable Auto-Detection</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <SettingItem
          title="Export to CSV"
          description="Export all transactions as CSV file"
          onPress={handleExport}
          disabled={loading}
          iconName="export"
        />

        <SettingItem
          title="Import Sample Data"
          description="Add sample transactions for testing"
          onPress={handleImportSample}
          disabled={loading}
          iconName="database-import"
        />

        <SettingItem
          title="Reset All Data"
          description="Delete all transactions"
          onPress={handleResetData}
          destructive
          disabled={loading}
          iconName="delete-alert"
        />
      </View>

      {/* SMS & Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SMS & Permissions</Text>

        <SettingItem
          title="Request SMS Permission"
          description="Allow app to read SMS messages"
          onPress={handleRequestSMSPermission}
          disabled={loading}
          iconName="message-text"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ SMS reading requires native module implementation. This app demonstrates the parsing logic with sample data.
          </Text>
        </View>
      </View>

      {/* Database */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database</Text>

        <SettingItem
          title="Initialize Database"
          description="Setup or verify database tables"
          onPress={handleInitDB}
          disabled={loading}
          iconName="database-cog"
        />
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>UPI Spend Tracker</Text>
          <Text style={styles.infoCardText}>Version 1.0.0</Text>
          <Text style={styles.infoCardText}>
            Track your UPI transactions and manage spending
          </Text>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

// Reusable Setting Item Component
const SettingItem = ({
  title,
  description,
  onPress,
  destructive = false,
  disabled = false,
  iconName,
}: {
  title: string;
  description: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  iconName?: string;
}) => (
  <TouchableOpacity
    style={[styles.settingItem, disabled && styles.settingItemDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    {iconName && (
      <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
        <Icon name={iconName} size={22} color={destructive ? "#EF4444" : "#3B82F6"} />
      </View>
    )}
    <View style={styles.settingTextContainer}>
      <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
        {title}
      </Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Icon name="chevron-right" size={20} color="#D1D5DB" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDestructive: {
    backgroundColor: '#FEE2E2',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  destructiveText: {
    color: '#EF4444',
  },

  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  bottomPadding: {
    height: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusActiveText: {
    color: '#059669',
  },
  statusInactiveText: {
    color: '#DC2626',
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
