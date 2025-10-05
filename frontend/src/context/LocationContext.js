import React, { createContext, useState, useContext } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Request location permission and get current coordinates
   * Returns: { success: boolean, location?: {lat, lng}, error?: string }
   */
  const requestLocation = async () => {
    setLoading(true);

    try {
      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLoading(false);
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return { success: false, error: 'Location services disabled' };
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setLoading(false);
        Alert.alert(
          'Location Permission Required',
          'NightSwipe needs your location to find nearby places. Please enable location access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return { success: false, error: 'Permission denied' };
      }

      // Get current location with timeout
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Location request timed out')), 10000);
      });

      const location = await Promise.race([locationPromise, timeoutPromise]);

      const coordinates = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setCurrentLocation(coordinates);
      setLoading(false);

      return { success: true, location: coordinates };
    } catch (error) {
      setLoading(false);
      console.error('Location error:', error);

      let errorMessage = 'Failed to get your location. Please try again.';
      if (error.message.includes('timeout')) {
        errorMessage = 'Location request timed out. Please check your connection and try again.';
      }

      Alert.alert('Location Error', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Open device settings for location permissions
   */
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  /**
   * Check current permission status without requesting
   */
  const checkPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
  };

  /**
   * Clear cached location
   */
  const clearLocation = () => {
    setCurrentLocation(null);
  };

  const value = {
    currentLocation,
    permissionStatus,
    loading,
    requestLocation,
    checkPermission,
    clearLocation,
    openSettings,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
