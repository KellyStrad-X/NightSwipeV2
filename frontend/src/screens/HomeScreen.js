import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar,
  Alert,
  Image,
  Dimensions,
  AppState
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { testDeepLinkFlow } from '../utils/testDeepLink';
import InviteModal from '../components/InviteModal';
import api from '../services/api';

const { width } = Dimensions.get('window');
const LAST_CLOSE_KEY = '@nightswipe_last_close';
const WARM_START_THRESHOLD = 5 * 60 * 1000; // 5 minutes

/**
 * HomeScreen - Main authenticated home screen with integrated splash animation
 *
 * Features:
 * - S-801: Splash animation (cold start: moon → breathing glow → swipe transition, warm start: fade-in)
 * - S-301: Animated logo and CTAs based on user state
 * - S-302: Location permission integration
 * - S-203: Auth gate for invite actions (this screen is auth-only)
 * - S-402: Invite flow with modal and session creation
 *
 * Note: This screen is only accessible to authenticated users.
 * Deep link handling for guest joins is in App.js
 */
export default function HomeScreen({ navigation }) {
  const { currentUser, userProfile, logout } = useAuth();
  const { requestLocation, loading: locationLoading } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const [isWarmStart, setIsWarmStart] = useState(false);

  // Splash animation values
  const fullMoonOpacity = useRef(new Animated.Value(0)).current;
  const fullMoonScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const fullMoonTranslateX = useRef(new Animated.Value(0)).current;
  const crescentOpacity = useRef(new Animated.Value(0)).current;
  const crescentTranslateX = useRef(new Animated.Value(width)).current;

  // Home screen animation values
  const logoPosition = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // Detect cold vs warm start and run splash animation
  useEffect(() => {
    const checkStartType = async () => {
      let warmStart = false;

      try {
        const lastCloseTime = await AsyncStorage.getItem(LAST_CLOSE_KEY);
        const now = Date.now();

        if (lastCloseTime) {
          const timeSinceClose = now - parseInt(lastCloseTime, 10);
          warmStart = timeSinceClose < WARM_START_THRESHOLD;
          setIsWarmStart(warmStart);
          console.log(`🚀 ${warmStart ? 'Warm' : 'Cold'} start detected (${Math.round(timeSinceClose / 1000)}s since close)`);
        } else {
          console.log('🚀 First launch - Cold start');
          setIsWarmStart(false);
        }
      } catch (error) {
        console.error('Error checking start type:', error);
        setIsWarmStart(false);
      }

      // Start splash animation after detection (pass warmStart directly to avoid race condition)
      setTimeout(() => startSplashAnimation(warmStart), 100);
    };

    checkStartType();

    // Track app state changes to save close time
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        await AsyncStorage.setItem(LAST_CLOSE_KEY, Date.now().toString());
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const startSplashAnimation = (isWarm) => {
    if (isWarm) {
      // Warm start: Quick logo fade-in
      Animated.sequence([
        Animated.timing(crescentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(300),
      ]).start(() => {
        transitionToHome();
      });
    } else {
      // Cold start: Full animation sequence
      Animated.sequence([
        // 1. Moon fades in SLOWLY (1.2s)
        Animated.parallel([
          Animated.timing(fullMoonOpacity, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(fullMoonScale, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),

        // 2. Breathing glow starts (loops during hold)
        Animated.delay(200),

        // Start breathing glow animation
        Animated.parallel([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),

        // Breathing effect (2 cycles)
        Animated.sequence([
          // Breathe in
          Animated.timing(glowScale, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          // Breathe out
          Animated.timing(glowScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          // Breathe in again
          Animated.timing(glowScale, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          // Breathe out
          Animated.timing(glowScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),

        // 3. Moon swipes LEFT + Crescent slides in from RIGHT (simultaneous)
        Animated.parallel([
          // Moon swipes left
          Animated.timing(fullMoonTranslateX, {
            toValue: -width,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fullMoonOpacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          // Glow fades out with moon
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          // Crescent slides in from right
          Animated.timing(crescentTranslateX, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(crescentOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),

        // 4. Hold for a moment
        Animated.delay(500),
      ]).start(() => {
        transitionToHome();
      });
    }
  };

  const transitionToHome = () => {
    // Logo slides up + button fades in + header fades in
    Animated.parallel([
      Animated.timing(logoPosition, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSplashComplete(true);
    });
  };

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
      Alert.alert('Login Required', 'Please log in to invite others to a session.');
      return;
    }

    console.log('[TELEMETRY] Invite action initiated by user:', currentUser.uid);

    // S-302: Request location permission
    const locationResult = await requestLocation();
    if (!locationResult.success) {
      console.log('❌ Location permission denied');
      return;
    }

    console.log('✅ Location obtained:', locationResult.location);

    try {
      setCreatingSession(true);

      // S-401/S-402: Create session
      const response = await api.post('/api/v1/session', {
        host_lat: locationResult.location.lat,
        host_lng: locationResult.location.lng
      });

      console.log('✅ Session created:', response.data);
      setSessionData(response.data);
      setInviteModalVisible(true);
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create session. Please try again.'
      );
    } finally {
      setCreatingSession(false);
    }
  };

  const handleInviteSent = () => {
    // Navigate to lobby after invite is sent
    console.log('📤 Invite sent, navigating to lobby');
    setInviteModalVisible(false);
    navigation.navigate('Lobby', {
      sessionId: sessionData.session_id,
      role: 'host'
    });
  };

  const handleStartBrowse = async () => {
    // Solo mode - create session without guest
    const locationResult = await requestLocation();
    if (!locationResult.success) {
      console.log('❌ Location permission denied');
      return;
    }

    console.log('✅ Location obtained:', locationResult.location);

    try {
      setCreatingSession(true);

      // Create solo session
      const sessionResponse = await api.post('/api/v1/session', {
        host_lat: locationResult.location.lat,
        host_lng: locationResult.location.lng
      });

      console.log('✅ Solo session created:', sessionResponse.data);

      // Generate deck immediately
      const deckResponse = await api.post(`/api/v1/session/${sessionResponse.data.session_id}/deck`);
      console.log('✅ Deck generated:', deckResponse.data.total_count, 'places');

      // Navigate directly to deck screen
      navigation.navigate('Deck', {
        sessionId: sessionResponse.data.session_id
      });
    } catch (error) {
      console.error('❌ Failed to start solo browse:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to start browsing. Please try again.'
      );
    } finally {
      setCreatingSession(false);
    }
  };

  // DEV ONLY: Test deep link functionality
  const handleTestDeepLink = async () => {
    const testCode = 'TEST' + Math.floor(Math.random() * 1000);
    await testDeepLinkFlow(testCode, !!currentUser);
  };

  // Calculate logo position (center to top)
  const logoTranslateY = logoPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200], // Slide up 200px
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with username (fades in after splash) */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <Text style={styles.username}>
          {userProfile?.display_name || 'User'}
        </Text>
        <View style={styles.headerButtons}>
          {__DEV__ && (
            <TouchableOpacity onPress={handleTestDeepLink} style={styles.devButton}>
              <Text style={styles.devButtonText}>🧪 Test Link</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={logout} style={styles.logoutIcon}>
            <Text style={styles.logoutText}>↪</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main content area */}
      <View style={styles.content}>
        {/* Full Moon (cold start only - swipes left) */}
        {!isWarmStart && (
          <>
            {/* Breathing glow behind moon */}
            <Animated.View
              style={[
                styles.breathingGlow,
                {
                  opacity: glowOpacity,
                  transform: [{ scale: glowScale }],
                },
              ]}
            />

            {/* Full moon image */}
            <Animated.View
              style={[
                styles.fullMoonContainer,
                {
                  opacity: fullMoonOpacity,
                  transform: [
                    { translateX: fullMoonTranslateX },
                    { scale: fullMoonScale },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/logo-full-moon.png')}
                style={styles.fullMoonImage}
                resizeMode="contain"
              />
            </Animated.View>
          </>
        )}

        {/* Crescent Logo (slides in from right, then slides up) */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: crescentOpacity,
              transform: [
                { translateX: crescentTranslateX },
                { translateY: logoTranslateY },
              ],
            },
          ]}
        >
          <Image
            source={require('../../assets/logo-crescent.png')}
            style={styles.crescentImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Initial CTA - Start Searching (fades in after splash) */}
        {!expanded && (
          <Animated.View style={[styles.ctaContainer, { opacity: buttonsOpacity }]}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartSearching}
            >
              <Text style={styles.primaryButtonText}>Start Searching</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Find places to explore together</Text>
          </Animated.View>
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
              style={[styles.secondaryButton, (locationLoading || creatingSession) && styles.buttonDisabled]}
              onPress={handleInvite}
              disabled={locationLoading || creatingSession}
            >
              <Text style={styles.secondaryButtonText}>
                {creatingSession ? '⏳ Creating Session...' : locationLoading ? '📍 Getting Location...' : '📤 Invite Someone'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, (locationLoading || creatingSession) && styles.buttonDisabled]}
              onPress={handleStartBrowse}
              disabled={locationLoading || creatingSession}
            >
              <Text style={styles.primaryButtonText}>
                {creatingSession ? '⏳ Creating Session...' : locationLoading ? '📍 Getting Location...' : 'Start Browse'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.expandedHint}>
              Swipe together or invite a friend
            </Text>
          </Animated.View>
        )}
      </View>

      {/* S-402: Invite Modal */}
      <InviteModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        onInviteSent={handleInviteSent}
        sessionData={sessionData}
        hostProfile={userProfile}
      />
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devButton: {
    backgroundColor: '#ff6b00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  // Splash animation styles
  breathingGlow: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: 'rgba(98, 0, 238, 0.2)',
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 20,
  },
  fullMoonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMoonImage: {
    width: width * 0.35,
    height: width * 0.35,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  crescentImage: {
    width: width * 0.65,
    height: width * 0.25,
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
