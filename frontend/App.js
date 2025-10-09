import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Alert, Animated, Image, Dimensions, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import OfflineBanner from './src/components/OfflineBanner';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import DeckScreen from './src/screens/DeckScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import MatchScreen from './src/screens/MatchScreen';
import MatchFoundScreen from './src/screens/MatchFoundScreen';
import NoMatchScreen from './src/screens/NoMatchScreen';
import WaitingForConfirmScreen from './src/screens/WaitingForConfirmScreen';
import WaitingForRestartScreen from './src/screens/WaitingForRestartScreen';
import { storePendingJoinCode } from './src/utils/deepLinkStorage';
import api from './src/services/api';

const Stack = createNativeStackNavigator();
const { width } = Dimensions.get('window');
const LAST_CLOSE_KEY = '@nightswipe_last_close';
const WARM_START_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// Deep link configuration
const linking = {
  prefixes: [
    'nightswipe://',
    'https://nightswipe.app',
    'http://nightswipe.app', // For testing
  ],
  config: {
    screens: {
      Home: 'home',
      Login: 'login',
      Register: 'register',
      // Join screen will be handled dynamically (not a real screen yet)
      Join: 'join/:code',
    },
  },
};

function Navigation() {
  const { currentUser, loading, pendingJoinCode, userProfile } = useAuth();
  const navigationRef = useRef();

  // DEV HELPER: Expose deep link trigger to global scope for testing
  // Usage in dev console: global.testDeepLink('TEST123')
  useEffect(() => {
    if (__DEV__) {
      global.testDeepLink = (code) => {
        const testUrl = `exp://192.168.1.1:8081/--/join?code=${code}`;
        console.log('🧪 [DEV] Triggering test deep link:', testUrl);
        handleDeepLink(testUrl);
      };
      console.log('🧪 [DEV] Deep link tester available: global.testDeepLink("YOUR_CODE")');
    }
  }, [currentUser]);

  // Handle pending join code after authentication (S-402: auto-join flow)
  useEffect(() => {
    const handlePendingJoin = async () => {
      if (currentUser && pendingJoinCode) {
        console.log('🚀 Auto-joining session after auth:', pendingJoinCode);

        try {
          // Look up session by join code
          const lookupResponse = await api.get(`/api/v1/session/by-code/${pendingJoinCode}`);
          const sessionId = lookupResponse.data.session_id;
          console.log('📍 Session found:', sessionId);

          // Join the session
          const joinResponse = await api.post(`/api/v1/session/${sessionId}/join`, {
            join_code: pendingJoinCode
          });
          console.log('✅ Successfully joined session:', joinResponse.data);

          // Clear pending join code
          // (Note: getPendingJoinCode already removes it from storage)

          // Navigate to lobby as guest
          if (navigationRef.current) {
            navigationRef.current.navigate('Lobby', {
              sessionId: sessionId,
              role: 'guest'
            });
          }
        } catch (error) {
          console.error('❌ Failed to auto-join session:', error);

          let errorMessage = 'Failed to join session. Please try again.';
          if (error.response?.status === 404) {
            errorMessage = 'This session no longer exists.';
          } else if (error.response?.status === 400) {
            errorMessage = error.response.data.message || 'Unable to join this session.';
          }

          Alert.alert('Join Failed', errorMessage, [{ text: 'OK' }]);
        }
      }
    };

    handlePendingJoin();
  }, [currentUser, pendingJoinCode]);

  // Handle deep links
  useEffect(() => {
    // Handle initial URL (app opened from cold start via link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('📱 App opened with initial URL:', initialUrl);
        await handleDeepLink(initialUrl);
      }
    };

    // Handle URL events (app already running, link opened)
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('📱 Deep link received:', event.url);
      handleDeepLink(event.url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, [currentUser]);

  /**
   * Handle deep link URLs
   * Extracts join code and routes user based on auth state
   *
   * Supports:
   * - Production: nightswipe://join?code=ABC123
   * - Production: https://nightswipe.app/join?code=ABC123
   * - Expo Go Dev: exp://192.168.x.x:8081/--/join?code=ABC123
   */
  const handleDeepLink = async (url) => {
    try {
      console.log('📱 Raw deep link URL:', url);
      const parsed = Linking.parse(url);
      console.log('📱 Parsed deep link:', parsed);

      let path = parsed.path;
      let queryParams = parsed.queryParams || {};

      // EXPO GO FIX: Handle exp:// scheme URLs
      // In Expo Go, URLs look like: exp://192.168.x.x:8081/--/join?code=ABC123
      // The path comes as '--/join' or just the full URL needs manual parsing
      if (parsed.scheme === 'exp' || url.includes('exp://')) {
        console.log('🔧 Detected Expo Go URL - applying custom parsing');

        // Extract path after --/ prefix
        const expPathMatch = url.match(/--\/([^?]+)/);
        if (expPathMatch) {
          path = expPathMatch[1];
          console.log('🔧 Extracted path from Expo Go URL:', path);
        }

        // Extract query params manually
        const queryMatch = url.match(/\?(.+)$/);
        if (queryMatch) {
          const queryString = queryMatch[1];
          const params = {};
          queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[key] = decodeURIComponent(value);
          });
          queryParams = params;
          console.log('🔧 Extracted query params from Expo Go URL:', queryParams);
        }
      }

      // Check if this is a join link
      if (path === 'join' && queryParams?.code) {
        const joinCode = queryParams.code;
        console.log('📱 Join code extracted:', joinCode);

        if (!currentUser) {
          // User not authenticated - store code and show login message
          console.log('🔐 User not authenticated - storing join code');
          await storePendingJoinCode(joinCode);

          Alert.alert(
            'Join Session',
            'Please log in or create an account to join this session.',
            [{ text: 'OK' }]
          );
        } else {
          // User authenticated - join session and navigate to lobby
          console.log('✅ User authenticated - joining session:', joinCode);

          try {
            // Look up session by join code
            const lookupResponse = await api.get(`/api/v1/session/by-code/${joinCode}`);
            const sessionId = lookupResponse.data.session_id;
            console.log('📍 Session found:', sessionId);

            // Join the session
            const joinResponse = await api.post(`/api/v1/session/${sessionId}/join`, {
              join_code: joinCode
            });
            console.log('✅ Successfully joined session:', joinResponse.data);

            // Navigate to lobby as guest
            if (navigationRef.current) {
              navigationRef.current.navigate('Lobby', {
                sessionId: sessionId,
                role: 'guest'
              });
            }
          } catch (error) {
            console.error('❌ Failed to join session:', error);

            let errorMessage = 'Failed to join session. Please try again.';
            if (error.response?.status === 404) {
              errorMessage = 'This session no longer exists.';
            } else if (error.response?.status === 400) {
              errorMessage = error.response.data.message || 'Unable to join this session.';
            }

            Alert.alert('Join Failed', errorMessage, [{ text: 'OK' }]);
          }
        }
      } else {
        console.log('ℹ️ Deep link did not match join pattern:', { path, queryParams });
      }
      // Handle other deep link paths here (e.g., /home, /profile, etc.)
    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  };

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        {/* Home screen is now universal - shows for logged in AND logged out users */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* App screens - only accessible when logged in */}
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="Deck" component={DeckScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="Match" component={MatchScreen} />
        <Stack.Screen name="MatchFound" component={MatchFoundScreen} />
        <Stack.Screen name="NoMatch" component={NoMatchScreen} />
        <Stack.Screen name="WaitingForConfirm" component={WaitingForConfirmScreen} />
        <Stack.Screen name="WaitingForRestart" component={WaitingForRestartScreen} />

        {/* Keep auth screens for registration flow */}
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
      <StatusBar style="light" />
      <OfflineBanner />
      <Toast />
    </NavigationContainer>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isWarmStart, setIsWarmStart] = useState(false);

  // Splash animation values
  const fullMoonOpacity = useRef(new Animated.Value(0)).current;
  const fullMoonScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const fullMoonTranslateX = useRef(new Animated.Value(0)).current;
  const crescentOpacity = useRef(new Animated.Value(0)).current;
  const crescentTranslateX = useRef(new Animated.Value(width)).current;

  // Detect cold vs warm start and run splash animation
  useEffect(() => {
    const checkStartType = async () => {
      let warmStart = false;

      try {
        const lastCloseTime = await AsyncStorage.getItem(LAST_CLOSE_KEY);
        const now = Date.now();

        console.log('🔍 [DEBUG] Last close time from storage:', lastCloseTime);
        console.log('🔍 [DEBUG] Current time:', now);

        if (lastCloseTime) {
          const timeSinceClose = now - parseInt(lastCloseTime, 10);
          warmStart = timeSinceClose < WARM_START_THRESHOLD;
          setIsWarmStart(warmStart);
          console.log(`🚀 ${warmStart ? 'Warm' : 'Cold'} start detected (${Math.round(timeSinceClose / 1000)}s since close)`);
        } else {
          console.log('🚀 First launch - Cold start (no previous close time)');
          setIsWarmStart(false);
        }
      } catch (error) {
        console.error('❌ Error checking start type:', error);
        setIsWarmStart(false);
      }

      console.log('🎬 [DEBUG] Starting splash animation - warmStart:', warmStart);
      // Start splash animation after detection
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
    console.log('🎭 [DEBUG] Animation starting - isWarm:', isWarm);

    if (isWarm) {
      console.log('⚡ Running WARM start animation');
      // Warm start: Quick logo fade-in
      Animated.sequence([
        Animated.timing(crescentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]).start(() => {
        setShowSplash(false);
      });
    } else {
      console.log('❄️ Running COLD start animation (full moon sequence)');
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
        setShowSplash(false);
      });
    }
  };

  // Show splash screen
  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />

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
                source={require('./assets/logo-full-moon.png')}
                style={styles.fullMoonImage}
                resizeMode="contain"
              />
            </Animated.View>
          </>
        )}

        {/* Crescent Logo (slides in from right) */}
        <Animated.View
          style={[
            styles.crescentContainer,
            {
              opacity: crescentOpacity,
              transform: [{ translateX: crescentTranslateX }],
            },
          ]}
        >
          <Image
            source={require('./assets/logo-crescent.png')}
            style={styles.crescentImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <AuthProvider>
      <LocationProvider>
        <Navigation />
      </LocationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingGlow: {
    position: 'absolute',
    width: width * 0.37,
    height: width * 0.37,
    borderRadius: (width * 0.37) / 2,
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
  crescentContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crescentImage: {
    width: width * 0.75,
    height: width * 0.3,
  },
});
