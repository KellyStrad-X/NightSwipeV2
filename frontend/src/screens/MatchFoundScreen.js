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
 * MatchFoundScreen - S-602
 *
 * Shows "IT'S A MATCH!" celebration and carousel of matched places
 * - Horizontal scrollable list of places both users swiped right on
 * - Tap a place to see full details (navigate to Match screen)
 * - Back button to return to lobby
 */
export default function MatchFoundScreen({ route, navigation }) {
  const { matches, sessionId } = route.params;

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Celebration Header */}
      <View style={styles.celebrationHeader}>
        <Text style={styles.celebrationEmoji}>💫</Text>
        <Text style={styles.celebrationTitle}>IT'S A MATCH!</Text>
        <Text style={styles.celebrationSubtitle}>
          You both liked {matches.length} place{matches.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Matched Places Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          data={matches}
          renderItem={renderPlace}
          horizontal
          pagingEnabled
          snapToInterval={SCREEN_WIDTH * 0.85 + 20}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          keyExtractor={(item) => item.place_id}
        />
      </View>

      {/* Footer with Back Button */}
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
  celebrationHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  celebrationEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  carouselContent: {
    paddingHorizontal: SCREEN_WIDTH * 0.075,
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  photoContainer: {
    width: '100%',
    height: '60%',
    backgroundColor: '#2a2a2a',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholderView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    fontSize: 80,
  },
  infoContainer: {
    flex: 1,
    padding: 20,
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  category: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#6200ee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
  },
  rating: {
    fontSize: 14,
    color: '#ffd700',
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#999',
    marginBottom: 6,
  },
  distance: {
    fontSize: 14,
    color: '#999',
    marginRight: 10,
  },
  reviews: {
    fontSize: 12,
    color: '#666',
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(98, 0, 238, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tapHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  backButton: {
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
