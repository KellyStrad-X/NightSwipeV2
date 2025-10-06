// API service for backend communication
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Debug: Log API URL on load
console.log('🔧 API Service initialized with URL:', API_URL);

/**
 * Get authentication token from secure storage
 */
const getAuthToken = async () => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    return token;
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return null;
  }
};

/**
 * Generic API request helper with auth token
 */
const request = async (method, endpoint, data = null, customHeaders = {}) => {
  try {
    const token = await getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const responseData = await response.json();

    if (!response.ok) {
      const error = new Error(responseData.message || responseData.error || 'Request failed');
      error.response = {
        status: response.status,
        data: responseData,
      };
      throw error;
    }

    return { data: responseData };
  } catch (error) {
    console.error(`API ${method} ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * API Client with axios-like interface
 */
const api = {
  get: (endpoint, headers = {}) => request('GET', endpoint, null, headers),
  post: (endpoint, data, headers = {}) => request('POST', endpoint, data, headers),
  put: (endpoint, data, headers = {}) => request('PUT', endpoint, data, headers),
  patch: (endpoint, data, headers = {}) => request('PATCH', endpoint, data, headers),
  delete: (endpoint, headers = {}) => request('DELETE', endpoint, null, headers),
};

export default api;

/**
 * Health check endpoint (legacy - kept for backward compatibility)
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
