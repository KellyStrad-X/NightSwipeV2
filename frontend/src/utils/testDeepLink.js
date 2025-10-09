import { Alert } from 'react-native';
import { storePendingJoinCode } from './deepLinkStorage';
import * as Linking from 'expo-linking';

/**
 * DEV ONLY: Simulate a deep link join flow
 * This mimics what happens when a user clicks a join link
 *
 * @param {string} joinCode - The join code to test with (optional - will prompt if not provided)
 * @param {boolean} isAuthenticated - Whether user is currently logged in
 * @returns {Promise<void>}
 */
export const testDeepLinkFlow = async (joinCode = null, isAuthenticated) => {
  // If no code provided, prompt user to enter one
  if (!joinCode) {
    Alert.prompt(
      'Test Join Link',
      'Enter a join code to test:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async (code) => {
            if (code && code.trim()) {
              await testDeepLinkFlow(code.trim(), isAuthenticated);
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
    return;
  }

  console.log('🧪 [DEV] Simulating deep link with code:', joinCode);
  console.log('🧪 [DEV] User authenticated:', isAuthenticated);

  // Trigger the actual deep link handler with a properly formatted URL
  const testUrl = `exp://192.168.1.181:8081/--/join?code=${joinCode}`;
  console.log('🧪 [DEV] Triggering deep link:', testUrl);

  // Use Linking to emit the URL event (this triggers App.js deep link handler)
  Linking.openURL(testUrl).catch(() => {
    // If openURL fails (it might in some scenarios), manually store and navigate
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated - storing join code');
      storePendingJoinCode(joinCode);
      Alert.alert(
        'Join Session',
        'Please log in or create an account to join this session.',
        [{ text: 'OK' }]
      );
    }
  });
};
