import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

/**
 * HomeScreen - Main authenticated home screen
 *
 * Features:
 * - S-301: Animated logo and CTAs based on user state
 * - S-302: Location permission integration
 * - S-203: Auth gate for invite actions (this screen is auth-only)
 *
 * Note: This screen is only accessible to authenticated users.
 * Deep link handling for guest joins is in App.js
 */
export default function HomeScreen() {
  const { currentUser, userProfile, logout } = useAuth();
  const { requestLocation, loading: locationLoading } = useLocation();
  const [expanded, setExpanded] = useState(false);

  // Animation values
  const logoPosition = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  const handleStartSearching = () => {
    if (expanded) return; // Already expanded

    setExpanded(true);

    // Animate logo slide up and buttons fade in
    Animated.parallel([
      Animated.timing(logoPosition, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 300,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleInvite = async () => {
    // S-203: Auth gate - verify user is authenticated before invite
    if (!currentUser) {
      console.warn('[TELEMETRY] Unauthorized invite attempt - user not authenticated');
      alert('Please log in to invite others to a session.');
      return;
    }

    console.log('[TELEMETRY] Invite action initiated by user:', currentUser.uid);

    const result = await requestLocation();
    if (result.success) {
      console.log('Location obtained:', result.location);
      // TODO: S-401/S-402 - Create session and open invite modal
      console.log('Next: Create session and show invite modal');
    }
  };

  const handleStartBrowse = async () => {
    const result = await requestLocation();
    if (result.success) {
      console.log('Location obtained:', result.location);
      // TODO: S-501 - Fetch deck from Google Places API
      console.log('Next: Fetch deck and navigate to swipe screen');
    }
  };

  // Calculate logo position (center to top)
  const logoTranslateY = logoPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200], // Slide up 200px
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with username */}
      <View style={styles.header}>
        <Text style={styles.username}>
          {userProfile?.display_name || 'User'}
        </Text>
        <TouchableOpacity onPress={logout} style={styles.logoutIcon}>
          <Text style={styles.logoutText}>↪</Text>
        </TouchableOpacity>
      </View>

      {/* Main content area */}
      <View style={styles.content}>
        {/* Logo with animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <View style={styles.logoGlow}>
            <Text style={styles.logo}>🌙</Text>
          </View>
          <Text style={styles.appName}>NightSwipe</Text>
        </Animated.View>

        {/* Initial CTA - Start Searching */}
        {!expanded && (
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartSearching}
            >
              <Text style={styles.primaryButtonText}>Start Searching</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Find places to explore together</Text>
          </View>
        )}

        {/* Expanded buttons - Invite and Start Browse */}
        {expanded && (
          <Animated.View
            style={[
              styles.expandedButtons,
              { opacity: buttonsOpacity },
            ]}
          >
            <TouchableOpacity
              style={[styles.secondaryButton, locationLoading && styles.buttonDisabled]}
              onPress={handleInvite}
              disabled={locationLoading}
            >
              <Text style={styles.secondaryButtonText}>
                {locationLoading ? '📍 Getting Location...' : '📤 Invite Someone'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, locationLoading && styles.buttonDisabled]}
              onPress={handleStartBrowse}
              disabled={locationLoading}
            >
              <Text style={styles.primaryButtonText}>
                {locationLoading ? 'Getting Location...' : 'Start Browse'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.expandedHint}>
              Swipe together or invite a friend
            </Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  logoutIcon: {
    padding: 8,
  },
  logoutText: {
    fontSize: 24,
    color: '#888',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: 64,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    letterSpacing: 1,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#6200ee',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#6200ee',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  expandedButtons: {
    width: '100%',
    alignItems: 'center',
  },
  expandedHint: {
    color: '#666',
    fontSize: 13,
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
