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
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { testDeepLinkFlow } from '../utils/testDeepLink';
import InviteModal from '../components/InviteModal';
import api from '../services/api';

const { width } = Dimensions.get('window');

/**
 * HomeScreen - Universal home screen for all users
 *
 * Features:
 * - S-801: Logo slide-up animation after splash completes
 * - Shows inline login form for logged-out users
 * - Shows full app interface for logged-in users
 * - User status indicator with blue/red icons
 * - S-301: Animated logo and CTAs based on user state
 * - S-302: Location permission integration
 * - S-402: Invite flow with modal and session creation
 */
export default function HomeScreen({ navigation }) {
  const { currentUser, userProfile, logout, login } = useAuth();
  const { requestLocation, loading: locationLoading } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Animation values
  const logoPosition = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Run entry animation when screen mounts
  useEffect(() => {
    // Small delay to let splash finish cleanly
    setTimeout(() => {
      Animated.parallel([
        // Logo slides up
        Animated.timing(logoPosition, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Content fades in
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);
  }, []);

  const handleStartSearching = () => {
    // Check if user is logged in
    if (!currentUser) {
      Alert.alert('Login Required', 'You need to be logged in to start searching!');
      return;
    }

    if (expanded) return; // Already expanded
    setExpanded(true);
  };

  const handleLoginPress = () => {
    setShowLoginForm(!showLoginForm);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setLoginLoading(true);
      await login(email, password);
      // Login successful - reset form
      setEmail('');
      setPassword('');
      setShowLoginForm(false);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
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

  // Calculate logo position (center to slightly up)
  const logoTranslateY = logoPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80], // Slide up 80px
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Dev/logout buttons in top right */}
        <View style={styles.topRightButtons}>
          {__DEV__ && (
            <>
              <TouchableOpacity onPress={handleTestDeepLink} style={styles.devButton}>
                <Text style={styles.devButtonText}>🧪 Test Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await AsyncStorage.setItem('@nightswipe_force_cold_start', 'true');
                  Alert.alert('Done', 'Force-close the app and reopen for cold start');
                }}
                style={[styles.devButton, { backgroundColor: '#0066ff' }]}
              >
                <Text style={styles.devButtonText}>❄️ Cold Start</Text>
              </TouchableOpacity>
            </>
          )}
          {currentUser && (
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>↪</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main content area */}
        <View style={styles.content}>
          {/* Logo with slide-up animation */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ translateY: logoTranslateY }],
              },
            ]}
          >
            <Image
              source={require('../../assets/logo-crescent.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Content that fades in */}
          <Animated.View style={[styles.buttonsContainer, { opacity: contentOpacity }]}>
            {/* Start Searching Button */}
            {!expanded && !showLoginForm && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStartSearching}
              >
                <Text style={styles.primaryButtonText}>Start Searching</Text>
              </TouchableOpacity>
            )}

            {/* User Status Indicator */}
            {!expanded && !showLoginForm && (
              <TouchableOpacity
                style={styles.userStatus}
                onPress={currentUser ? null : handleLoginPress}
                disabled={!!currentUser}
              >
                <Image
                  source={
                    currentUser
                      ? require('../../assets/user.blue.icon.png')
                      : require('../../assets/user.red.icon.png')
                  }
                  style={styles.userIcon}
                  resizeMode="contain"
                />
                <Text style={styles.userStatusText}>
                  {currentUser ? (userProfile?.display_name || 'User') : 'log in'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Inline Login Form */}
            {showLoginForm && (
              <View style={styles.loginForm}>
                <Text style={styles.loginFormTitle}>Welcome Back</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.primaryButton, loginLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loginLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loginLoading ? 'Logging in...' : 'Log In'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRegister} style={styles.linkButton}>
                  <Text style={styles.linkText}>Don't have an account? Register</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowLoginForm(false)} style={styles.linkButton}>
                  <Text style={styles.linkText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Expanded buttons - Invite and Start Browse (Logged In) */}
            {expanded && currentUser && (
              <View style={styles.expandedButtons}>
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
              </View>
            )}
          </Animated.View>
        </View>

        {/* Footer - Callsign */}
        <Animated.View style={[styles.footer, { opacity: contentOpacity }]}>
          <Image
            source={require('../../assets/swipe-decide-go.png')}
            style={styles.callsignLogo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* S-402: Invite Modal */}
        <InviteModal
          visible={inviteModalVisible}
          onClose={() => setInviteModalVisible(false)}
          onInviteSent={handleInviteSent}
          sessionData={sessionData}
          hostProfile={userProfile}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  topRightButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
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
  logoutButton: {
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
    marginBottom: 80,
  },
  logoImage: {
    width: width * 0.75,
    height: width * 0.3,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
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
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  userIcon: {
    width: 32,
    height: 32,
  },
  userStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loginForm: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  loginFormTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#6200ee',
    fontSize: 14,
    fontWeight: '600',
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
  footer: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  callsignLogo: {
    width: width * 0.5,
    height: 40,
  },
});
