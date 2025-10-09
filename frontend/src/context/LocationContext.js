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

// Configuration
const LOCATION_TIMEOUT = 15000; // 15 seconds for GPS acquisition
const MAX_LOCATION_AGE = 5000; // Accept coordinates up to 5s old

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Request location permission and get current coordinates
   * Returns: { success: boolean, location?: {lat, lng}, isFallback?: boolean, error?: string }
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

      // Get current location with built-in timeout and maximumAge
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: LOCATION_TIMEOUT,
          maximumAge: MAX_LOCATION_AGE,
        });

        const coordinates = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };

        setCurrentLocation(coordinates);
        setLoading(false);

        return { success: true, location: coordinates };
      } catch (locationError) {
        // Check if it's a timeout error
        const isTimeout =
          locationError.code === 'E_LOCATION_TIMEOUT' ||
          locationError.message?.toLowerCase().includes('timed out');

        if (isTimeout) {
          console.warn('Location request timed out, attempting fallback to last known position');

          // Try to get last known position as fallback
          try {
            const lastKnown = await Location.getLastKnownPositionAsync({
              maxAge: 60000, // Accept positions up to 1 minute old
              requiredAccuracy: 500, // Accept accuracy within 500m
            });

            if (lastKnown) {
              const fallbackCoordinates = {
                lat: lastKnown.coords.latitude,
                lng: lastKnown.coords.longitude,
              };

              setCurrentLocation(fallbackCoordinates);
              setLoading(false);

              console.warn('Using last known position (may be stale):', fallbackCoordinates);
              return { success: true, location: fallbackCoordinates, isFallback: true };
            }
          } catch (fallbackError) {
            console.error('Last known position also unavailable:', fallbackError);
          }

          // No fallback available - offer retry
          setLoading(false);
          return new Promise((resolve) => {
            Alert.alert(
              'Location Timeout',
              'Unable to get your current location. This can happen indoors or in areas with poor GPS signal.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve({ success: false, error: 'Location timeout - user cancelled' }),
                },
                {
                  text: 'Retry',
                  onPress: async () => {
                    console.info('Retrying location request after timeout');
                    const retryResult = await requestLocation();
                    resolve(retryResult);
                  },
                },
              ]
            );
          });
        }

        // Other location errors (not timeout)
        setLoading(false);
        console.error('Location error:', locationError);

        const errorMessage = 'Failed to get your location. Please try again.';
        Alert.alert('Location Error', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      // Permission/service errors
      setLoading(false);
      console.error('Location permission/service error:', error);
      return { success: false, error: error.message };
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
