import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import api from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4; // 40% of screen width

/**
 * DeckScreen - S-502
 *
 * Displays swipeable cards for places in session deck
 * - Fetches deck from backend
 * - Swipe left (reject) or right (like)
 * - Visual overlays for feedback
 * - Button controls as fallback
 * - Progress counter
 * - End of deck handling
 */
export default function DeckScreen({ route, navigation }) {
  const { sessionId } = route.params;

  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const position = useRef(new Animated.ValueXY()).current;
  const swipeDirection = useRef(new Animated.Value(0)).current;

  // Fetch deck from backend
  useEffect(() => {
    fetchDeck();
  }, []);

  const fetchDeck = async () => {
    try {
      // Fetch the deck from backend
      const deckResponse = await api.get(`/api/v1/session/${sessionId}/deck`);

      const sortedDeck = deckResponse.data.deck.sort((a, b) => a.order - b.order);
      setDeck(sortedDeck);
      setLoading(false);
      console.log('📚 Deck loaded:', sortedDeck.length, 'places');
    } catch (err) {
      console.error('Failed to fetch deck:', err);

      if (err.response?.status === 404) {
        Alert.alert(
          'No Deck',
          'Deck has not been generated yet. Please go back and generate it first.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setError(err.response?.data?.message || 'Failed to load deck');
      }
      setLoading(false);
    }
  };

  // Create pan responder for gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        swipeDirection.setValue(gesture.dx);
      },
      onPanResponderRelease: (evt, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right - Like
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left - Reject
          forceSwipe('left');
        } else {
          // Spring back to center
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction) => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction) => {
    const currentPlace = deck[currentIndex];
    console.log(`${direction === 'right' ? '♥' : '✗'} Swiped ${direction}:`, currentPlace.name);

    // TODO: S-503 - Submit swipe to backend
    // For now, just move to next card

    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(currentIndex + 1);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 5,
    }).start();
  };

  const handleSwipeLeft = () => {
    forceSwipe('left');
  };

  const handleSwipeRight = () => {
    forceSwipe('right');
  };

  // Card rotation based on swipe
  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-30deg', '0deg', '30deg'],
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  // Overlay opacity for like/nope
  const getLikeOpacity = () => {
    return position.x.interpolate({
      inputRange: [0, SCREEN_WIDTH / 4],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  };

  const getNopeOpacity = () => {
    return position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 4, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
  };

  const renderCard = (place, index) => {
    if (index < currentIndex) {
      return null; // Already swiped
    }

    if (index === currentIndex) {
      // Top card - active
      return (
        <Animated.View
          key={place.place_id}
          style={[styles.card, getCardStyle()]}
          {...panResponder.panHandlers}
        >
          {/* Like overlay */}
          <Animated.View
            style={[
              styles.overlay,
              styles.likeOverlay,
              { opacity: getLikeOpacity() },
            ]}
          >
            <Text style={styles.overlayText}>♥</Text>
          </Animated.View>

          {/* Nope overlay */}
          <Animated.View
            style={[
              styles.overlay,
              styles.nopeOverlay,
              { opacity: getNopeOpacity() },
            ]}
          >
            <Text style={styles.overlayText}>✗</Text>
          </Animated.View>

          {/* Card content */}
          <View style={styles.cardContent}>
            {/* Photo placeholder */}
            <View style={styles.photoContainer}>
              <Text style={styles.photoPlaceholder}>📷</Text>
              <Text style={styles.photoText}>Photo: {place.name}</Text>
            </View>

            {/* Info section */}
            <View style={styles.infoContainer}>
              <Text style={styles.placeName}>{place.name}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.category}>{place.category}</Text>
                {place.rating && (
                  <Text style={styles.rating}>⭐ {place.rating}</Text>
                )}
              </View>

              <Text style={styles.address}>{place.address}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.distance}>📍 {place.distance_km} km</Text>
                {place.review_count > 0 && (
                  <Text style={styles.reviews}>({place.review_count} reviews)</Text>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      );
    }

    // Next cards in stack - scaled down
    const scale = index === currentIndex + 1 ? 0.95 : 0.9;
    const translateY = (index - currentIndex) * 10;

    return (
      <Animated.View
        key={place.place_id}
        style={[
          styles.card,
          {
            transform: [{ scale }, { translateY }],
            zIndex: -index,
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.photoContainer}>
            <Text style={styles.photoPlaceholder}>📷</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.placeName}>{place.name}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading places...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (currentIndex >= deck.length) {
    // End of deck
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneText}>All done!</Text>
          <Text style={styles.doneSubtext}>
            You've swiped through all {deck.length} places
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Back to Lobby</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.header}>
        <Text style={styles.progress}>
          {currentIndex + 1} / {deck.length}
        </Text>
      </View>

      {/* Card stack */}
      <View style={styles.deckContainer}>
        {deck.map((place, index) => renderCard(place, index)).reverse()}
      </View>

      {/* Button controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.nopeButton]}
          onPress={handleSwipeLeft}
        >
          <Text style={styles.buttonText}>✗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.likeButton]}
          onPress={handleSwipeRight}
        >
          <Text style={styles.buttonText}>♥</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  progress: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  deckContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  likeOverlay: {
    backgroundColor: 'rgba(0, 200, 0, 0.3)',
  },
  nopeOverlay: {
    backgroundColor: 'rgba(200, 0, 0, 0.3)',
  },
  overlayText: {
    fontSize: 100,
    fontWeight: 'bold',
  },
  photoContainer: {
    height: '60%',
    backgroundColor: '#2a2a2a',
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
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    gap: 60,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nopeButton: {
    backgroundColor: '#ff4444',
  },
  likeButton: {
    backgroundColor: '#00c853',
  },
  buttonText: {
    fontSize: 40,
    color: '#fff',
  },
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  doneEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  doneText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  doneSubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
