import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { onSyncStatusChange, manualSync, SyncStatus } from '../services/syncService';

export const SyncStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    isSyncing: false,
    pendingUploads: 0,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onSyncStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    try {
      await manualSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          {status.isSyncing ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <View style={[styles.dot, { backgroundColor: status.error ? '#f44336' : '#4CAF50' }]} />
          )}
          <Text style={styles.statusText}>
            {status.isSyncing
              ? 'Syncing...'
              : status.error
              ? 'Sync error'
              : `Synced ${formatLastSync(status.lastSyncTime)}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.syncButton, status.isSyncing && styles.syncButtonDisabled]}
          onPress={handleManualSync}
          disabled={status.isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {status.isSyncing ? '⏳' : '🔄'}
          </Text>
        </TouchableOpacity>
      </View>

      {status.error && (
        <Text style={styles.errorText}>{status.error}</Text>
      )}

      {status.pendingUploads > 0 && (
        <Text style={styles.pendingText}>
          {status.pendingUploads} pending upload{status.pendingUploads > 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#ccc',
  },
  syncButtonText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  pendingText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
  },
});
