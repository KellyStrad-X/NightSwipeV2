import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_JOIN_CODE_KEY = '@nightswipe_pending_join_code';

/**
 * Store a pending join code for post-authentication navigation
 * @param {string} joinCode - The session join code from the deep link
 * @returns {Promise<boolean>} Success status
 */
export const storePendingJoinCode = async (joinCode) => {
  try {
    if (!joinCode || typeof joinCode !== 'string') {
      console.warn('Invalid join code provided to storePendingJoinCode');
      return false;
    }

    await AsyncStorage.setItem(PENDING_JOIN_CODE_KEY, joinCode);
    console.log('✅ Stored pending join code:', joinCode);
    return true;
  } catch (error) {
    console.error('Failed to store pending join code:', error);
    return false;
  }
};

/**
 * Retrieve and clear the pending join code
 * @returns {Promise<string|null>} The join code or null if none exists
 */
export const getPendingJoinCode = async () => {
  try {
    const joinCode = await AsyncStorage.getItem(PENDING_JOIN_CODE_KEY);

    if (joinCode) {
      console.log('✅ Retrieved pending join code:', joinCode);
      // Clear it immediately after retrieval (one-time use)
      await AsyncStorage.removeItem(PENDING_JOIN_CODE_KEY);
    }

    return joinCode;
  } catch (error) {
    console.error('Failed to retrieve pending join code:', error);
    return null;
  }
};

/**
 * Clear any pending join code (e.g., user cancelled)
 * @returns {Promise<boolean>} Success status
 */
export const clearPendingJoinCode = async () => {
  try {
    await AsyncStorage.removeItem(PENDING_JOIN_CODE_KEY);
    console.log('✅ Cleared pending join code');
    return true;
  } catch (error) {
    console.error('Failed to clear pending join code:', error);
    return false;
  }
};

/**
 * Check if a pending join code exists
 * @returns {Promise<boolean>} True if a pending code exists
 */
export const hasPendingJoinCode = async () => {
  try {
    const joinCode = await AsyncStorage.getItem(PENDING_JOIN_CODE_KEY);
    return joinCode !== null;
  } catch (error) {
    console.error('Failed to check for pending join code:', error);
    return false;
  }
};
