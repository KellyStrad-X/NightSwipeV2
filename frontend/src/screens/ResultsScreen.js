import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ResultsScreen - S-601
 *
 * Shows carousel of places user swiped right on
 * - Horizontal scrollable list of liked places
 * - Tap a place to see full details (navigate to Match screen)
 * - Back button to return to lobby
 */
export default function ResultsScreen({ route, navigation }) {
  const { likedPlaces, sessionId } = route.params;

  const renderPlace = ({ item: place }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Match', { place, sessionId })}
        activeOpacity={0.9}
      >
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
            </View>
          )}
        </View>

        {/* Info section */}
        <View style={styles.infoContainer}>
          <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.category}>{place.category}</Text>
            {place.rating && (
              <Text style={styles.rating}>⭐ {place.rating}</Text>
            )}
          </View>

          <Text style={styles.address} numberOfLines={1}>{place.address}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.distance}>📍 {place.distance_km} km</Text>
            {place.review_count > 0 && (
              <Text style={styles.reviews}>({place.review_count} reviews)</Text>
            )}
          </View>
        </View>

        {/* Tap hint */}
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>Tap for details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state
  if (!likedPlaces || likedPlaces.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.emptyText}>No places matched</Text>
          <Text style={styles.emptySubtext}>
            You didn't swipe right on any places
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Lobby</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Picks ♥</Text>
        <Text style={styles.headerSubtitle}>
          {likedPlaces.length} place{likedPlaces.length !== 1 ? 's' : ''} you liked
        </Text>
      </View>

      {/* Carousel */}
      <FlatList
        data={likedPlaces}
        renderItem={renderPlace}
        keyExtractor={(item) => item.place_id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH * 0.85 + 20}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContainer}
      />

      {/* Back Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
  },
  carouselContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.075,
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  photoContainer: {
    height: '60%',
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
  infoContainer: {
    height: '40%',
    padding: 20,
    justifyContent: 'space-between',
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '600',
  },
  rating: {
    fontSize: 16,
    color: '#ffd700',
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#aaa',
    marginVertical: 8,
  },
  distance: {
    fontSize: 14,
    color: '#888',
  },
  reviews: {
    fontSize: 14,
    color: '#888',
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(98, 0, 238, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tapHintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
});
