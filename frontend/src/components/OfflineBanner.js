/**
 * OfflineBanner - S-901
 *
 * Displays a banner when device is offline
 * - Sticky at top of screen
 * - Auto-shows when offline
 * - Auto-dismisses when online
 * - Triggers retry queue processing when connection restored
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import retryQueue from '../utils/retryQueue';
import api from '../services/api';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected || !state.isInternetReachable;

      console.log('📶 Network state:', {
        connected: state.isConnected,
        reachable: state.isInternetReachable,
        type: state.type,
        offline
      });

      if (offline && !isOffline) {
        // Just went offline
        console.log('📴 Device went offline');
        setIsOffline(true);
        showBanner();
      } else if (!offline && isOffline) {
        // Just came online
        console.log('📶 Device came online');
        setIsOffline(false);
        hideBanner();

        // Process retry queue after small delay
        setTimeout(() => {
          console.log('🔄 Processing retry queue...');
          retryQueue.process(api);
        }, 1000);
      }
    });

    // Check initial state
    NetInfo.fetch().then(state => {
      const offline = !state.isConnected || !state.isInternetReachable;
      if (offline) {
        setIsOffline(true);
        showBanner();
      }
    });

    // Load retry queue from storage
    retryQueue.loadQueue();

    return () => {
      unsubscribe();
    };
  }, [isOffline]);

  const showBanner = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.icon}>📴</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>You're offline</Text>
        <Text style={styles.subtitle}>Some features won't work</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48, // Account for status bar
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  icon: {
    fontSize: 24,
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2
  },
  subtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9
  }
});
