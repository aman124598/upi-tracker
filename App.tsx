/**
 * Main App Component
 * Root component with navigation and database initialization
 */

import './global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// Services
import { initDatabase } from './src/services/db';
import { startSMSMonitoring, checkSMSPermission, requestSMSPermission } from './src/services/smsReader';
import { initSyncService } from './src/services/syncService';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize database and SMS monitoring on app start
    const initialize = async () => {
      // Set timeout to prevent infinite loading
      const initTimeout = setTimeout(() => {
        console.warn('⚠️ Initialization timeout - showing app anyway');
        setIsReady(true);
      }, 10000);
      
      try {
        console.log('🚀 Initializing UPI Spend Tracker...');
        
        // Initialize database with timeout protection
        try {
          await Promise.race([
            initDatabase(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Init timeout')), 8000)
            )
          ]);
          console.log('✅ Database initialized successfully');
        } catch (dbError) {
          console.warn('⚠️ Database init skipped:', dbError);
        }
        
        // Initialize Firebase sync (will gracefully fail if not configured)
        try {
          const unsubscribeSync = await initSyncService();
          if (unsubscribeSync) {
            console.log('✅ Firebase sync enabled');
            
            // Store cleanup function if sync was enabled
            return () => {
              if (unsubscribeSync) unsubscribeSync();
            };
          }
        } catch (syncError) {
          console.log('⚠️ Firebase sync not configured yet - working offline only');
        }
        
        // Start SMS monitoring for automatic transaction detection
        try {
          const hasPermission = await checkSMSPermission();
          if (hasPermission) {
            const started = await startSMSMonitoring();
            if (started) {
              console.log('✅ Automatic SMS monitoring enabled');
            }
          } else {
            console.log('⚠️ SMS permissions not granted - automatic detection disabled');
          }
        } catch (smsError) {
          console.warn('⚠️ SMS monitoring skipped:', smsError);
        }
        
        clearTimeout(initTimeout);
        setIsReady(true);
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        clearTimeout(initTimeout);
        setIsReady(true); // Still show app even if initialization fails
      }
    };

    initialize();
  }, []);

  // Show loading screen while initializing
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: string;

              switch (route.name) {
                case 'Home':
                  iconName = focused ? 'home' : 'home-outline';
                  break;
                case 'Dashboard':
                  iconName = focused ? 'chart-box' : 'chart-box-outline';
                  break;
                case 'Transactions':
                  iconName = focused ? 'format-list-bulleted' : 'format-list-bulleted';
                  break;
                case 'Add':
                  iconName = 'plus-circle';
                  break;
                case 'Settings':
                  iconName = focused ? 'cog' : 'cog-outline';
                  break;
                default:
                  iconName = 'circle';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: {
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
            headerStyle: {
              backgroundColor: '#3B82F6',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'UPI Tracker',
              headerTitle: 'UPI Spend Tracker',
            }}
          />
          
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              title: 'Analytics',
              headerTitle: 'Dashboard',
            }}
          />
          
          <Tab.Screen
            name="Transactions"
            component={TransactionsScreen}
            options={{
              title: 'History',
              headerTitle: 'All Transactions',
            }}
          />
          
          <Tab.Screen
            name="Add"
            component={AddTransactionScreen}
            options={{
              title: 'Add',
              headerTitle: 'Add Transaction',
            }}
          />
          
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
              headerTitle: 'Settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});


/**
 * Database service placeholder
 * Add real database initialization (SQLite / Realm / etc.) as needed.
 */

