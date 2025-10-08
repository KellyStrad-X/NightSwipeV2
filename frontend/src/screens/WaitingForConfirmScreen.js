import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import api from '../services/api';

/**
 * WaitingForConfirmScreen - S-602
 *
 * Shows while waiting for other user(s) to confirm load-more
 * - Displays waiting message with spinner
 * - Polls backend every 2 seconds to check if all users confirmed
 * - Navigates to deck when new deck is generated
 */
export default function WaitingForConfirmScreen({ route, navigation }) {
  const { sessionId, confirmedUsers, totalUsers } = route.params;
  const [polling, setPolling] = useState(true);
  const [initialLoadMoreCount, setInitialLoadMoreCount] = useState(null);

  useEffect(() => {
    let pollInterval;

    const checkConfirmationStatus = async () => {
      try {
        // Check session status to see if new deck is ready
        const sessionResponse = await api.get(`/api/v1/session/${sessionId}`);
        const sessionData = sessionResponse.data;

        console.log('⏳ Polling load-more status:', {
          current: sessionData.load_more_count,
          initial: initialLoadMoreCount
        });

        // Store initial load_more_count on first poll
        if (initialLoadMoreCount === null) {
          console.log('📊 Setting initial load_more_count:', sessionData.load_more_count || 0);
          setInitialLoadMoreCount(sessionData.load_more_count || 0);
          return;
        }

        // Check if load_more_count increased (means new deck was generated)
        const currentLoadMoreCount = sessionData.load_more_count || 0;
        if (currentLoadMoreCount > initialLoadMoreCount) {
          // New deck generated!
          console.log('✨ New deck detected! Navigating to deck...');
          setPolling(false);
          clearInterval(pollInterval);

          // Navigate back to deck screen with new deck
          navigation.reset({
            index: 0,
            routes: [
              { name: 'Home' },
              { name: 'Lobby', params: { sessionId } },
              { name: 'Deck', params: { sessionId } }
            ]
          });
        }
      } catch (error) {
        console.error('❌ Error checking confirmation status:', error);
      }
    };

    // Poll every 2 seconds
    pollInterval = setInterval(checkConfirmationStatus, 2000);

    // Check immediately on mount
    checkConfirmationStatus();

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [sessionId, navigation, initialLoadMoreCount]);

  const remainingUsers = totalUsers - confirmedUsers;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hourglass emoji */}
        <Text style={styles.emoji}>⏳</Text>

        {/* Title */}
        <Text style={styles.title}>Waiting for others...</Text>

        {/* Status */}
        <Text style={styles.status}>
          {confirmedUsers} of {totalUsers} confirmed
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Waiting for {remainingUsers} more {remainingUsers === 1 ? 'person' : 'people'} to confirm{'\n'}
          loading more places
        </Text>

        {/* Spinner */}
        <ActivityIndicator size="large" color="#6200ee" style={styles.spinner} />

        {/* Helper text */}
        <Text style={styles.helperText}>
          Once everyone confirms, we'll fetch a new deck!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  status: {
    fontSize: 20,
    color: '#6200ee',
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  spinner: {
    marginVertical: 20,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
