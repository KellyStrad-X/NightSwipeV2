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
   */
  const handleDeepLink = async (url) => {
    try {
      const parsed = Linking.parse(url);
      console.log('📱 Parsed deep link:', parsed);

      // Check if this is a join link
      if (parsed.path === 'join' && parsed.queryParams?.code) {
        const joinCode = parsed.queryParams.code;
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
