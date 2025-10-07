import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * LobbyScreen - S-402
 *
 * Shows session lobby with host and guest waiting states
 *
 * Host variant:
 * - "Waiting for guest..." message
 * - Shows host + guest slots (guest pending)
 * - Polls for guest join
 * - "Start Browse" button when guest joins
 *
 * Guest variant:
 * - Shows host and guest names
 * - "Waiting for host to start..." message
 * - Polls for session status changes
 *
 * Route params:
 * - sessionId: string
 * - role: 'host' | 'guest'
 */
export default function LobbyScreen({ route, navigation }) {
  const { sessionId, role } = route.params;
  const { currentUser, userProfile } = useAuth();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(true);
  const [generatingDeck, setGeneratingDeck] = useState(false);

  const isHost = role === 'host';
  const hasGuest = sessionData?.guest !== null && sessionData?.guest !== undefined;

  // Fetch session data
  const fetchSession = async () => {
    try {
      const response = await api.get(`/api/v1/session/${sessionId}`);
      setSessionData(response.data);
      setError(null);
      console.log('📊 Lobby data updated:', response.data);

      // Check for session state changes
      if (response.data.status === 'expired') {
        setPolling(false);
        Alert.alert(
          'Session Expired',
          'This session has expired.',
          [{ text: 'OK', onPress: () => navigation.replace('Home') }]
        );
      } else if (response.data.status === 'cancelled') {
        setPolling(false);
        Alert.alert(
          'Session Cancelled',
          'The host has cancelled this session.',
          [{ text: 'OK', onPress: () => navigation.replace('Home') }]
        );
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
      setError(err.response?.data?.message || 'Failed to load session');

      if (err.response?.status === 404 || err.response?.status === 410) {
        setPolling(false);
        Alert.alert(
          'Session Not Found',
          'This session no longer exists.',
          [{ text: 'OK', onPress: () => navigation.replace('Home') }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, []);

  // Polling for updates (every 2 seconds)
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      fetchSession();
    }, 2000);

    return () => clearInterval(interval);
  }, [polling, sessionId]);

  const handleStartBrowse = async () => {
    setGeneratingDeck(true);
    console.log('🚀 Starting browse - generating deck for session:', sessionId);

    try {
      const response = await api.post(`/api/v1/session/${sessionId}/deck`);
      console.log('✅ Deck generated:', response.data);

      // TODO: S-502 - Navigate to swipe screen with deck data
      // For now, show success message
      Alert.alert(
        'Deck Ready!',
        `Found ${response.data.total_count} places nearby!\n\nSwipe UI coming in S-502.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Failed to generate deck:', err);

      let errorMessage = 'Failed to generate deck. Please try again.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = 'No places found in your area. Try a different location.';
      } else if (err.response?.status === 429) {
        errorMessage = 'API quota exceeded. Please try again later.';
      }

      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setGeneratingDeck(false);
    }
  };

  const handleCancelSession = async () => {
    Alert.alert(
      'Cancel Session?',
      'Are you sure you want to cancel this session?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: S-403 - PATCH /session/:id with status: 'cancelled'
              console.log('❌ Cancelling session:', sessionId);
              Alert.alert('Session Cancelled', 'Returning to home...', [
                { text: 'OK', onPress: () => navigation.replace('Home') }
              ]);
            } catch (err) {
              console.error('Failed to cancel session:', err);
              Alert.alert('Error', 'Failed to cancel session');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading lobby...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !sessionData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={styles.errorButtonText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session Lobby</Text>
        <Text style={styles.sessionCode}>{sessionData?.join_code}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Status Message */}
        <View style={styles.statusContainer}>
          {isHost ? (
            hasGuest ? (
              <>
                <Text style={styles.statusEmoji}>✅</Text>
                <Text style={styles.statusText}>
                  {sessionData.guest.display_name} has joined!
                </Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color="#6200ee" style={styles.statusSpinner} />
                <Text style={styles.statusText}>Waiting for guest...</Text>
                <Text style={styles.statusHint}>
                  Share your invite link with someone to get started
                </Text>
              </>
            )
          ) : (
            <>
              <ActivityIndicator size="large" color="#6200ee" style={styles.statusSpinner} />
              <Text style={styles.statusText}>Waiting for host to start...</Text>
            </>
          )}
        </View>

        {/* User Slots */}
        <View style={styles.usersContainer}>
          {/* Host Slot */}
          <View style={styles.userSlot}>
            <View style={[styles.userAvatar, styles.hostAvatar]}>
              <Text style={styles.userEmoji}>👤</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userLabel}>Host</Text>
              <Text style={styles.userName}>
                {sessionData?.host?.display_name || 'Unknown'}
              </Text>
            </View>
          </View>

          {/* Guest Slot */}
          <View style={styles.userSlot}>
            <View style={[styles.userAvatar, hasGuest ? styles.guestAvatar : styles.pendingAvatar]}>
              <Text style={styles.userEmoji}>{hasGuest ? '👤' : '?'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userLabel}>Guest</Text>
              <Text style={[styles.userName, !hasGuest && styles.pendingText]}>
                {hasGuest ? sessionData.guest.display_name : 'Waiting...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isHost && hasGuest && (
            <TouchableOpacity
              style={[styles.startButton, generatingDeck && styles.startButtonDisabled]}
              onPress={handleStartBrowse}
              disabled={generatingDeck}
            >
              {generatingDeck ? (
                <>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.startButtonText}>Generating Deck...</Text>
                </>
              ) : (
                <Text style={styles.startButtonText}>Start Browse 🚀</Text>
              )}
            </TouchableOpacity>
          )}

          {isHost && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSession}
            >
              <Text style={styles.cancelButtonText}>Cancel Session</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sessionCode: {
    fontSize: 14,
    color: '#6200ee',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  statusEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  statusSpinner: {
    marginBottom: 24,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  usersContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  userSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  hostAvatar: {
    backgroundColor: '#6200ee',
  },
  guestAvatar: {
    backgroundColor: '#03dac6',
  },
  pendingAvatar: {
    backgroundColor: '#333',
  },
  userEmoji: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
  },
  userLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  pendingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  actionsContainer: {
    gap: 12,
  },
  startButton: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#4a00a5',
    opacity: 0.7,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
