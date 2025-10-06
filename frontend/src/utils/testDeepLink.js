import { Alert } from 'react-native';
import { storePendingJoinCode } from './deepLinkStorage';

/**
 * DEV ONLY: Simulate a deep link join flow
 * This mimics what happens when a user clicks a join link
 *
 * @param {string} joinCode - The join code to test with
 * @param {boolean} isAuthenticated - Whether user is currently logged in
 * @returns {Promise<void>}
 */
export const testDeepLinkFlow = async (joinCode, isAuthenticated) => {
  console.log('🧪 [DEV] Simulating deep link with code:', joinCode);
  console.log('🧪 [DEV] User authenticated:', isAuthenticated);

  if (!isAuthenticated) {
    // User not authenticated - store code and show login message
    console.log('🔐 User not authenticated - storing join code');
    await storePendingJoinCode(joinCode);

    Alert.alert(
      'Join Session',
      'Please log in or create an account to join this session.',
      [{ text: 'OK' }]
    );
  } else {
    // User authenticated - show ready message
    console.log('✅ User authenticated - ready to join session:', joinCode);

    Alert.alert(
      'Join Session',
      `Ready to join session with code: ${joinCode}\n\n(Lobby screen coming in Sprint 03)`,
      [{ text: 'OK' }]
    );
  }
};
