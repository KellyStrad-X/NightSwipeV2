import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as Linking from 'expo-linking';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import { storePendingJoinCode } from './src/utils/deepLinkStorage';

const Stack = createNativeStackNavigator();

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
  const { currentUser, loading, pendingJoinCode } = useAuth();
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
          // User authenticated - navigate to session (for now, just log it)
          // In Sprint 03, this will navigate to the lobby screen
          console.log('✅ User authenticated - ready to join session:', joinCode);

          Alert.alert(
            'Join Session',
            `Ready to join session with code: ${joinCode}\n\n(Lobby screen coming in Sprint 03)`,
            [{ text: 'OK' }]
          );
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
        {currentUser ? (
          // User is authenticated - show app screens
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          // User is not authenticated - show auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
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
});
