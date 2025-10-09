import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator
} from 'react-native';
import api from '../services/api';

/**
 * MatchScreen - S-601, S-701, S-702
 *
 * Shows full details of a matched place
 * - Large photo
 * - Name, category, rating, reviews
 * - Full address
 * - Distance
 * - "Maps Link" button (S-701 ✅ Opens Apple/Google Maps)
 * - "Restart" button (S-702 ✅ Session restart with deck refresh)
 * - Back button
 */
export default function MatchScreen({ route, navigation }) {
  const { place, sessionId } = route.params;
  const [loading, setLoading] = useState(false);

  const handleMapsLink = async () => {
    // S-701: Open Apple/Google Maps with place location
    try {
      const { name, geometry } = place;
      const { lat, lng } = geometry.location;
      const encodedName = encodeURIComponent(name);

      // Platform-specific native maps URLs
      const url = Platform.select({
        ios: `maps:///?q=${encodedName}&ll=${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${encodedName}`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      });

      // Check if native maps app can be opened
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        // Web fallback if native app not available
        const webUrl = Platform.select({
          ios: `https://maps.apple.com/?q=${encodedName}&ll=${lat},${lng}`,
          android: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
          default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        });
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert(
        'Error',
        'Could not open maps. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRestart = async () => {
    // S-702: Restart session with new deck
    if (!sessionId) {
      Alert.alert('Error', 'Session ID not found. Cannot restart.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Requesting session restart...');
      const response = await api.post(`/api/v1/session/${sessionId}/restart`);
      const data = response.data;

      if (data.all_confirmed) {
        // Solo mode OR both users confirmed - new deck generated
        console.log('✅ Session restarted! Navigating to new deck...');
        Alert.alert(
          'Session Restarted!',
          'A new deck has been generated. Ready to swipe again!',
          [
            {
              text: 'Start Swiping',
              onPress: () => {
                // Navigate to deck with fresh state
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'Home' },
                    { name: 'Lobby', params: { sessionId } },
                    { name: 'Deck', params: { sessionId } }
                  ]
                });
              }
            }
          ]
        );
      } else {
        // Two-user mode - waiting for other user
        console.log('⏳ Waiting for other user to confirm restart...');
        navigation.navigate('WaitingForRestart', {
          sessionId,
          confirmedUsers: data.confirmed_users,
          totalUsers: data.total_users
        });
      }
    } catch (error) {
      console.error('❌ Error restarting session:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Could not restart session. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo */}
        <View style={styles.photoContainer}>
          {place.photo_url && !place.photo_url.includes('placeholder.com') ? (
            <Image
              source={{ uri: place.photo_url }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholderView}>
              <Text style={styles.photoPlaceholder}>📷</Text>
              <Text style={styles.photoText}>No photo available</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.placeName}>{place.name}</Text>

          {/* Category & Rating */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{place.category}</Text>
            </View>
            {place.rating && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {place.rating}</Text>
              </View>
            )}
          </View>

          {/* Reviews */}
          {place.review_count > 0 && (
            <Text style={styles.reviews}>
              {place.review_count} review{place.review_count !== 1 ? 's' : ''}
            </Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Address</Text>
            <Text style={styles.address}>{place.address}</Text>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Distance</Text>
            <Text style={styles.distance}>📍 {place.distance_km} km away</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.mapsButton}
              onPress={handleMapsLink}
            >
              <Text style={styles.mapsButtonText}>🗺️ Open in Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.restartButton, loading && styles.buttonDisabled]}
              onPress={handleRestart}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.restartButtonText}>🔄 Restart</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back to Results</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  photoContainer: {
    height: 300,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholderView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    fontSize: 64,
  },
  photoText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  placeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#6200ee',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  ratingText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '600',
  },
  reviews: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  distance: {
    fontSize: 16,
    color: '#fff',
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  mapsButton: {
    backgroundColor: '#00c853',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  mapsButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restartButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6200ee',
  },
  backButtonText: {
    color: '#6200ee',
    fontSize: 16,
    fontWeight: '600',
  },
});
