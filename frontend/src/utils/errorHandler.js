/**
 * Centralized Error Handler - S-901
 *
 * Provides consistent error handling across the app
 * - Parses API errors
 * - Maps error codes to user-friendly messages
 * - Determines retry vs show error vs redirect
 */

/**
 * Parse error response and extract meaningful message
 */
export const parseError = (error) => {
  // Network error (no response from server)
  if (!error.response) {
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return {
        type: 'network',
        message: 'No internet connection. Please check your network.',
        shouldRetry: true
      };
    }
    return {
      type: 'unknown',
      message: 'Something went wrong. Please try again.',
      shouldRetry: true
    };
  }

  const status = error.response.status;
  const data = error.response.data;

  // 401 Unauthorized - Token expired
  if (status === 401) {
    return {
      type: 'auth',
      message: 'Your session has expired. Please log in again.',
      shouldRetry: false,
      shouldRedirect: 'Login'
    };
  }

  // 403 Forbidden - Not allowed
  if (status === 403) {
    return {
      type: 'forbidden',
      message: data?.message || 'You do not have permission to access this.',
      shouldRetry: false
    };
  }

  // 404 Not Found - Session/resource doesn't exist
  if (status === 404) {
    return {
      type: 'not_found',
      message: data?.message || 'Session not found. It may have been deleted.',
      shouldRetry: false,
      shouldRedirect: 'Home'
    };
  }

  // 400 Bad Request - Validation error
  if (status === 400) {
    return {
      type: 'validation',
      message: data?.message || 'Invalid request. Please try again.',
      shouldRetry: false
    };
  }

  // 409 Conflict - Duplicate action (e.g., duplicate swipe)
  if (status === 409) {
    return {
      type: 'conflict',
      message: data?.message || 'This action was already completed.',
      shouldRetry: false,
      silent: true // Don't show error to user, already handled
    };
  }

  // 429 Too Many Requests - Rate limited
  if (status === 429) {
    return {
      type: 'rate_limit',
      message: 'Too many requests. Please wait a moment and try again.',
      shouldRetry: true,
      retryAfter: 3000 // 3 seconds
    };
  }

  // 500 Internal Server Error
  if (status >= 500) {
    return {
      type: 'server',
      message: 'Server error. Please try again later.',
      shouldRetry: true,
      retryAfter: 5000 // 5 seconds
    };
  }

  // Default error
  return {
    type: 'unknown',
    message: data?.message || 'Something went wrong. Please try again.',
    shouldRetry: true
  };
};

/**
 * Retry with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms (doubles each retry)
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorInfo = parseError(error);

      // Don't retry if error is not retryable
      if (!errorInfo.shouldRetry) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = errorInfo.retryAfter || baseDelay * Math.pow(2, attempt);
      console.log(`⚠️ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Handle error with appropriate action
 * @param {Error} error - The error object
 * @param {Object} navigation - React Navigation object
 * @param {Function} showAlert - Function to show alert (e.g., Alert.alert)
 * @param {Function} showToast - Function to show toast (optional)
 */
export const handleError = (error, navigation, showAlert, showToast = null) => {
  const errorInfo = parseError(error);

  console.error('❌ Error:', errorInfo);

  // Silent errors (already handled, like duplicate swipes)
  if (errorInfo.silent) {
    return;
  }

  // Redirect if needed
  if (errorInfo.shouldRedirect && navigation) {
    showAlert(
      'Error',
      errorInfo.message,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate(errorInfo.shouldRedirect)
        }
      ]
    );
    return;
  }

  // Show toast for non-critical errors (if available)
  if (showToast && (errorInfo.type === 'network' || errorInfo.type === 'rate_limit')) {
    showToast({
      type: 'error',
      text1: 'Error',
      text2: errorInfo.message,
      visibilityTime: 4000
    });
    return;
  }

  // Show alert for critical errors
  showAlert('Error', errorInfo.message, [{ text: 'OK' }]);
};

export default {
  parseError,
  retryWithBackoff,
  handleError
};
