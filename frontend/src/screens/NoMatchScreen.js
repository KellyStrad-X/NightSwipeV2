import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import api from '../services/api';

/**
 * NoMatchScreen - S-602
 *
 * Shows when zero matches are found between users
 * - Displays "No matches yet" message
 * - Offers "Load more places" option
 * - Navigates to WaitingForConfirm screen after user confirms
 */
export default function NoMatchScreen({ route, navigation }) {
  const { sessionId } = route.params;
  const [loading, setLoading] = useState(false);

  const handleLoadMore = async () => {
    try {
      setLoading(true);

      // Send load-more confirmation to backend
      const response = await api.post(`/api/v1/session/${sessionId}/load-more-confirm`);

      if (response.data.all_confirmed) {
        // Both users confirmed - new deck generated
        // Navigate back to deck screen
        navigation.reset({
          index: 0,
          routes: [
            { name: 'Home' },
            { name: 'Lobby', params: { sessionId } },
            { name: 'Deck', params: { sessionId } }
          ]
        });
      } else {
        // Waiting for other user to confirm
        navigation.navigate('WaitingForConfirm', {
          sessionId,
          confirmedUsers: response.data.confirmed_users,
          totalUsers: response.data.total_users
        });
      }
    } catch (error) {
      console.error('Error confirming load-more:', error);
      alert('Failed to load more places. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Sad emoji */}
        <Text style={styles.emoji}>😕</Text>

        {/* Title */}
        <Text style={styles.title}>No Matches Yet</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          You didn't swipe right on the same places.{'\n'}
          Want to try more?
        </Text>

        {/* Load More Button */}
        <TouchableOpacity
          style={[styles.loadMoreButton, loading && styles.loadMoreButtonDisabled]}
          onPress={handleLoadMore}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loadMoreButtonText}>🔄 Load More Places</Text>
          )}
        </TouchableOpacity>

        {/* Back to Home Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
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
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  loadMoreButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 16,
    minWidth: 220,
    alignItems: 'center',
  },
  loadMoreButtonDisabled: {
    backgroundColor: '#4a0099',
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
  },
  backButtonText: {
    color: '#999',
    fontSize: 16,
  },
});
