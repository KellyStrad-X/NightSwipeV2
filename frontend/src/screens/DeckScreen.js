import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  Image
} from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import ErrorModal from '../components/ErrorModal';
import retryQueue from '../utils/retryQueue';
import { parseError, retryWithBackoff } from '../utils/errorHandler';

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
  const [sessionStatus, setSessionStatus] = useState(null);
  const [polling, setPolling] = useState(false);
  const [submittedSwipes, setSubmittedSwipes] = useState(0); // Track completed swipe submissions
  const [rightSwipes, setRightSwipes] = useState([]); // Track places swiped right
  const [quota, setQuota] = useState(null); // Random quota for solo mode (3-6)
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalConfig, setErrorModalConfig] = useState({});

  const position = useRef(new Animated.ValueXY()).current;
  const swipeDirection = useRef(new Animated.Value(0)).current;
  const deckRef = useRef(deck); // Keep ref to current deck

  // Update ref when deck changes
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  // Fetch deck from backend
  useEffect(() => {
    fetchDeck();
  }, []);

  const fetchDeck = async (retryCount = 0) => {
    try {
      // Fetch the deck from backend with retry logic
      const deckResponse = await retryWithBackoff(() =>
        api.get(`/api/v1/session/${sessionId}/deck`)
      );

      const sortedDeck = deckResponse.data.deck.sort((a, b) => a.order - b.order);
      setDeck(sortedDeck);

      // Check if solo mode, and only set quota for solo sessions
      const statusResponse = await api.get(`/api/v1/session/${sessionId}/status`);
      const userCount = statusResponse.data.users.length;

      if (userCount === 1) {
        // Generate random quota for solo mode (3-6 right swipes)
        const randomQuota = Math.floor(Math.random() * 4) + 3; // 3-6
        setQuota(randomQuota);
        console.log('🎯 Solo quota set:', randomQuota, 'right swipes needed');
      } else {
        // Two-user mode - no quota
        console.log('👥 Two-user mode detected - no quota');
      }

      setLoading(false);
      console.log('📚 Deck loaded:', sortedDeck.length, 'places');
    } catch (err) {
      console.error('Failed to fetch deck:', err);
      const errorInfo = parseError(err);

      setLoading(false);

      // Show error modal with retry option
      setErrorModalConfig({
        title: 'Failed to Load Deck',
        message: errorInfo.message,
        onRetry: errorInfo.shouldRetry ? () => {
          setShowErrorModal(false);
          setLoading(true);
          fetchDeck();
        } : null,
        onDismiss: () => {
          setShowErrorModal(false);
          if (errorInfo.shouldRedirect) {
            navigation.navigate(errorInfo.shouldRedirect);
          } else {
            navigation.goBack();
          }
        }
      });
      setShowErrorModal(true);
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

  const onSwipeComplete = useCallback((direction) => {
    // Reset position immediately
    position.setValue({ x: 0, y: 0 });

    // Use functional update to avoid state closure issues
    setCurrentIndex(prevIndex => {
      const currentDeck = deckRef.current;
      const currentPlace = currentDeck[prevIndex];

      // Submit swipe to backend
      if (currentPlace) {
        console.log(`${direction === 'right' ? '♥' : '✗'} Swiped ${direction}:`, currentPlace.name);
        submitSwipe(currentPlace.place_id, direction);

        // Track right swipes for solo mode
        if (direction === 'right') {
          setRightSwipes(prev => [...prev, currentPlace]);
        }
      }

      return prevIndex + 1;
    });
  }, [position]);

  const submitSwipe = async (placeId, direction) => {
    try {
      console.log(`📤 Submitting swipe: ${direction} for place ${placeId.substring(0, 8)}...`);
      await api.post(`/api/v1/session/${sessionId}/swipe`, {
        place_id: placeId,
        direction: direction
      });

      console.log(`✅ Swipe submitted successfully`);
      // Increment counter when swipe successfully submitted
      setSubmittedSwipes(prev => prev + 1);
    } catch (err) {
      const errorInfo = parseError(err);

      // Handle duplicate swipes gracefully (409 is okay, means already swiped)
      if (err.response?.status === 409) {
        console.log(`⚠️ Duplicate swipe (already exists in backend)`);
        // Still count it as submitted since it exists in backend
        setSubmittedSwipes(prev => prev + 1);
        return;
      }

      console.error('❌ Failed to submit swipe:', err.response?.data?.message || err.message);

      // S-901: Queue failed swipe for retry
      if (errorInfo.shouldRetry) {
        console.log('📥 Adding swipe to retry queue');
        await retryQueue.add({
          url: `/api/v1/session/${sessionId}/swipe`,
          method: 'POST',
          data: {
            place_id: placeId,
            direction: direction
          }
        });

        // Show toast notification
        Toast.show({
          type: 'info',
          text1: 'Swipe Queued',
          text2: 'Will retry when connection is restored',
          visibilityTime: 2000
        });

        // Still count it as submitted for UI purposes
        setSubmittedSwipes(prev => prev + 1);
      } else {
        // Non-retryable error - show toast
        Toast.show({
          type: 'error',
          text1: 'Swipe Failed',
          text2: errorInfo.message,
          visibilityTime: 3000
        });
      }
    }
  };

  // Fetch session status to check completion
  const fetchSessionStatus = async () => {
    try {
      const response = await api.get(`/api/v1/session/${sessionId}/status`);
      setSessionStatus(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch session status:', err);
      return null;
    }
  };

  // Calculate match intersection for two-user mode
  const calculateMatches = async () => {
    try {
      console.log('🎯 Calculating matches...');
      const response = await api.post(`/api/v1/session/${sessionId}/calculate-match`);
      const { match_count, matches } = response.data;

      console.log(`✨ Match calculation complete: ${match_count} matches found`);

      if (match_count > 0) {
        // Navigate to MatchFound screen with matches
        navigation.navigate('MatchFound', {
          matches: matches,
          sessionId: sessionId
        });
      } else {
        // Navigate to NoMatch screen
        navigation.navigate('NoMatch', {
          sessionId: sessionId
        });
      }
    } catch (err) {
      console.error('Failed to calculate matches:', err);
      Alert.alert(
        'Error',
        'Failed to calculate matches. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  // Poll for completion when user finishes deck
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      const status = await fetchSessionStatus();

      if (status && status.status === 'completed') {
        // Both users finished
        setPolling(false);
        clearInterval(interval);

        // Calculate matches and navigate
        console.log('🎯 Polling detected both users finished! Calculating matches...');
        calculateMatches();
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [polling, sessionId]);

  // Check for quota completion (solo mode)
  useEffect(() => {
    if (quota && rightSwipes.length >= quota && !polling) {
      // Quota met! Navigate to results
      console.log(`🎯 Quota met! ${rightSwipes.length}/${quota} right swipes`);
      navigation.navigate('Results', {
        likedPlaces: rightSwipes,
        sessionId: sessionId
      });
    }
  }, [rightSwipes.length, quota]);

  // Check for completion when all swipes are submitted (end of deck)
  useEffect(() => {
    // Only proceed if we've swiped all cards AND all swipes have been submitted
    if (currentIndex >= deck.length && submittedSwipes >= deck.length && deck.length > 0 && !polling) {
      // Fetch status to check if we're in solo or two-user mode
      fetchSessionStatus().then(status => {
        if (status) {
          const userCount = status.users.length;

          if (userCount === 1) {
            // Solo mode - reached end of deck without meeting quota
            // Show all right swipes anyway
            console.log(`📚 End of deck: ${rightSwipes.length} right swipes`);
            navigation.navigate('Results', {
              likedPlaces: rightSwipes,
              sessionId: sessionId
            });
          } else {
            // Two-user mode - check if both finished
            const allFinished = status.users.every(u => u.finished);

            if (allFinished) {
              // Both finished - calculate matches
              console.log('🎯 Both users finished! Calculating matches...');
              calculateMatches();
            } else {
              // Other user still swiping - start polling
              setPolling(true);
            }
          }
        }
      });
    }
  }, [currentIndex, deck.length, submittedSwipes, polling]);

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
            {/* Photo */}
            <View style={styles.photoContainer}>
              {place.photo_url && !place.photo_url.includes('placeholder.com') ? (
                <Image
                  source={{ uri: place.photo_url }}
                  style={styles.photo}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('Failed to load image for:', place.name);
                  }}
                />
              ) : (
                <View style={styles.photoPlaceholderView}>
                  <Text style={styles.photoPlaceholder}>📷</Text>
                  <Text style={styles.photoText}>No photo available</Text>
                </View>
              )}
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
    // Check if swipes are still being submitted
    if (submittedSwipes < deck.length) {
      // Show syncing screen while swipes are in flight
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.doneContainer}>
            <ActivityIndicator size="large" color="#6200ee" style={{ marginBottom: 24 }} />
            <Text style={styles.doneText}>Syncing swipes...</Text>
            <Text style={styles.doneSubtext}>
              {submittedSwipes} / {deck.length} submitted
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    // End of deck - show waiting screen if polling
    if (polling && sessionStatus) {
      const otherUser = sessionStatus.users.find(u => !u.finished);
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.doneContainer}>
            <ActivityIndicator size="large" color="#6200ee" style={{ marginBottom: 24 }} />
            <Text style={styles.doneText}>Waiting for {otherUser?.display_name || 'other user'}...</Text>
            <Text style={styles.doneSubtext}>
              They're still swiping through the deck
            </Text>
            {sessionStatus.users.map(user => (
              <View key={user.user_id} style={styles.userProgress}>
                <Text style={styles.userProgressName}>{user.display_name}</Text>
                <Text style={styles.userProgressCount}>
                  {user.swipes_count} / {user.deck_size} {user.finished ? '✓' : '...'}
                </Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      );
    }

    // Fallback loading screen (while waiting for status check)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneContainer}>
          <ActivityIndicator size="large" color="#6200ee" style={{ marginBottom: 24 }} />
          <Text style={styles.doneText}>Checking status...</Text>
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

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title={errorModalConfig.title}
        message={errorModalConfig.message}
        onRetry={errorModalConfig.onRetry}
        onDismiss={errorModalConfig.onDismiss}
        dismissText={errorModalConfig.onRetry ? 'Cancel' : 'OK'}
      />
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
    overflow: 'hidden',
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
  userProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    width: '80%',
  },
  userProgressName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  userProgressCount: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'monospace',
  },
});
