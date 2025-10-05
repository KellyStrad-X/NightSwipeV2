// API service for backend communication
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Health check endpoint
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Health check failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generic API request helper
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return { success: true, data };
  } catch (error) {
    console.error(`API request failed (${endpoint}):`, error);
    return { success: false, error: error.message };
  }
};
