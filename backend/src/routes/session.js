const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const crypto = require('crypto');
const axios = require('axios');
const seedrandom = require('seedrandom');
const { verifyFirebaseToken } = require('../middleware/auth');

// Get Firestore instance
const getDb = () => admin.firestore();

/**
 * Generate unique alphanumeric join code
 * Format: 8 characters (e.g., "A3F9B21E")
 */
const generateJoinCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Deterministically shuffle array using seed
 * @param {Array} array - Array to shuffle
 * @param {string} seed - Seed for random number generator
 * @returns {Array} Shuffled array
 */
const shuffleWithSeed = (array, seed) => {
  const rng = seedrandom(seed);
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

/**
 * Fetch places from Google Places API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters
 * @returns {Promise<Array>} Array of places
 */
const fetchPlacesFromGoogle = async (lat, lng, radius) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY not configured');
  }

  const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

  try {
    const response = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius: radius,
        type: 'restaurant|bar|night_club|cafe',
        key: apiKey
      }
    });

    if (response.data.status === 'ZERO_RESULTS') {
      return [];
    }

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    throw error;
  }
};

/**
 * Normalize place data from Google Places API response
 * @param {Object} place - Raw place data from Google
 * @param {number} hostLat - Host latitude
 * @param {number} hostLng - Host longitude
 * @param {string} apiKey - Google API key for photo URLs
 * @returns {Object} Normalized place data
 */
const normalizePlace = (place, hostLat, hostLng, apiKey) => {
  // Determine category from types
  let category = 'Activity';
  if (place.types.includes('restaurant')) {
    category = 'Restaurant';
  } else if (place.types.includes('bar') || place.types.includes('night_club')) {
    category = 'Bar';
  } else if (place.types.includes('cafe')) {
    category = 'Cafe';
  }

  // Get photo URL
  let photoUrl = 'https://via.placeholder.com/400x300?text=No+Image';
  if (place.photos && place.photos.length > 0) {
    const photoRef = place.photos[0].photo_reference;
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`;
  }

  // Calculate distance
  const distance = calculateDistance(
    hostLat,
    hostLng,
    place.geometry.location.lat,
    place.geometry.location.lng
  );

  return {
    place_id: place.place_id,
    name: place.name,
    photo_url: photoUrl,
    category: category,
    rating: place.rating || null,
    review_count: place.user_ratings_total || 0,
    address: place.vicinity || place.formatted_address || 'Address not available',
    distance_km: Math.round(distance * 10) / 10 // Round to 1 decimal
  };
};

/**
 * POST /session
 * Create a new session
 *
 * Request Body:
 * {
 *   "host_lat": number,
 *   "host_lng": number
 * }
 *
 * Response (201):
 * {
 *   "session_id": string,
 *   "join_code": string,
 *   "session_url": string,
 *   "host_location": { lat, lng },
 *   "status": "pending"
 * }
 */
router.post('/session', verifyFirebaseToken, async (req, res) => {
  try {
    const { host_lat, host_lng } = req.body;
    const hostId = req.user.uid;

    // Validate input
    if (typeof host_lat !== 'number' || typeof host_lng !== 'number') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'host_lat and host_lng must be numbers'
      });
    }

    if (host_lat < -90 || host_lat > 90 || host_lng < -180 || host_lng > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const db = getDb();
    const joinCode = generateJoinCode();
    const sessionRef = db.collection('sessions').doc();

    const sessionData = {
      host_id: hostId,
      join_code: joinCode,
      host_lat,
      host_lng,
      deck_seed: null, // Will be set when deck is generated
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await sessionRef.set(sessionData);

    // Add host as session member
    await sessionRef.collection('session_members').doc(hostId).set({
      role: 'host',
      joined_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      session_id: sessionRef.id,
      join_code: joinCode,
      session_url: `https://nightswipe.app/join/${joinCode}`,
      host_location: {
        lat: host_lat,
        lng: host_lng
      },
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: error.message
    });
  }
});

/**
 * GET /session/by-code/:joinCode
 * Look up session by join code (for guest deep link flow)
 *
 * Response (200):
 * {
 *   "session_id": string,
 *   "join_code": string,
 *   "status": string,
 *   "host": { id, display_name }
 * }
 */
router.get('/session/by-code/:joinCode', verifyFirebaseToken, async (req, res) => {
  try {
    const { joinCode } = req.params;

    const db = getDb();
    const sessionsRef = db.collection('sessions');
    const querySnapshot = await sessionsRef.where('join_code', '==', joinCode).limit(1).get();

    if (querySnapshot.empty) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'No session found with this join code'
      });
    }

    const sessionDoc = querySnapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Fetch host profile
    const hostProfile = await db.collection('users').doc(sessionData.host_id).get();

    res.status(200).json({
      session_id: sessionDoc.id,
      join_code: sessionData.join_code,
      status: sessionData.status,
      host: {
        id: sessionData.host_id,
        display_name: hostProfile.data()?.display_name || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Error looking up session by code:', error);
    res.status(500).json({
      error: 'Failed to lookup session',
      message: error.message
    });
  }
});

/**
 * POST /session/:id/join
 * Join an existing session
 *
 * Request Body:
 * {
 *   "join_code": string (optional, for validation)
 * }
 *
 * Response (200):
 * {
 *   "session_id": string,
 *   "status": "active",
 *   "host": { id, display_name },
 *   "guest": { id, display_name }
 * }
 */
router.post('/session/:id/join', verifyFirebaseToken, async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { join_code } = req.body;
    const guestId = req.user.uid;

    const db = getDb();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    // Check if session exists
    if (!sessionDoc.exists) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The session you are trying to join does not exist'
      });
    }

    const sessionData = sessionDoc.data();

    // Validate join code if provided
    if (join_code && sessionData.join_code !== join_code) {
      return res.status(400).json({
        error: 'Invalid join code',
        message: 'The join code provided is incorrect'
      });
    }

    // Check if session is active or pending
    if (sessionData.status !== 'pending' && sessionData.status !== 'active') {
      return res.status(400).json({
        error: 'Session not available',
        message: `Session is ${sessionData.status} and cannot be joined`
      });
    }

    // Check if user is the host
    if (sessionData.host_id === guestId) {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'You are already the host of this session'
      });
    }

    // Check session member count
    const membersSnapshot = await sessionRef.collection('session_members').get();
    if (membersSnapshot.size >= 2) {
      return res.status(400).json({
        error: 'Session full',
        message: 'This session already has 2 members'
      });
    }

    // Check if user is already in session
    const existingMember = await sessionRef.collection('session_members').doc(guestId).get();
    if (existingMember.exists) {
      return res.status(400).json({
        error: 'Already joined',
        message: 'You have already joined this session'
      });
    }

    // Add guest as session member
    await sessionRef.collection('session_members').doc(guestId).set({
      role: 'guest',
      joined_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update session status to active
    await sessionRef.update({
      status: 'active',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Fetch host and guest profile data
    const hostProfile = await db.collection('users').doc(sessionData.host_id).get();
    const guestProfile = await db.collection('users').doc(guestId).get();

    res.status(200).json({
      session_id: sessionId,
      status: 'active',
      host: {
        id: sessionData.host_id,
        display_name: hostProfile.data()?.display_name || 'Unknown'
      },
      guest: {
        id: guestId,
        display_name: guestProfile.data()?.display_name || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({
      error: 'Failed to join session',
      message: error.message
    });
  }
});

/**
 * GET /session/:id
 * Get session details
 *
 * Response (200):
 * {
 *   "session_id": string,
 *   "status": string,
 *   "host": { id, display_name },
 *   "guest": { id, display_name } | null,
 *   "created_at": timestamp
 * }
 */
router.get('/session/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.uid;

    const db = getDb();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The session does not exist'
      });
    }

    const sessionData = sessionDoc.data();

    // Check if user is a member of this session
    const memberDoc = await sessionRef.collection('session_members').doc(userId).get();
    if (!memberDoc.exists) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not a member of this session'
      });
    }

    // Fetch all session members
    const membersSnapshot = await sessionRef.collection('session_members').get();
    const members = [];
    for (const doc of membersSnapshot.docs) {
      const memberData = doc.data();
      const userProfile = await db.collection('users').doc(doc.id).get();
      members.push({
        id: doc.id,
        role: memberData.role,
        display_name: userProfile.data()?.display_name || 'Unknown',
        joined_at: memberData.joined_at
      });
    }

    const host = members.find(m => m.role === 'host');
    const guest = members.find(m => m.role === 'guest');

    res.status(200).json({
      session_id: sessionId,
      status: sessionData.status,
      join_code: sessionData.join_code,
      host: host ? { id: host.id, display_name: host.display_name } : null,
      guest: guest ? { id: guest.id, display_name: guest.display_name } : null,
      created_at: sessionData.created_at,
      host_location: {
        lat: sessionData.host_lat,
        lng: sessionData.host_lng
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      error: 'Failed to get session',
      message: error.message
    });
  }
});

/**
 * GET /session/:id/deck
 * Retrieve deck for session
 *
 * Response (200):
 * {
 *   "session_id": string,
 *   "deck": [...],
 *   "deck_seed": string,
 *   "total_count": number
 * }
 */
router.get('/session/:id/deck', verifyFirebaseToken, async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.uid;

    const db = getDb();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    // Check if session exists
    if (!sessionDoc.exists) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The session does not exist'
      });
    }

    const sessionData = sessionDoc.data();

    // Check if user is a member of this session
    const memberDoc = await sessionRef.collection('session_members').doc(userId).get();
    if (!memberDoc.exists) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not a member of this session'
      });
    }

    // Check if deck exists
    if (!sessionData.deck_seed) {
      return res.status(404).json({
        error: 'Deck not found',
        message: 'Deck has not been generated for this session yet'
      });
    }

    // Fetch deck from subcollection
    const deckSnapshot = await sessionRef.collection('deck').get();
    const deck = [];
    deckSnapshot.forEach(doc => {
      deck.push(doc.data());
    });

    // Sort by order
    deck.sort((a, b) => a.order - b.order);

    console.log(`✅ Retrieved deck with ${deck.length} places for session ${sessionId}`);

    res.status(200).json({
      session_id: sessionId,
      deck: deck,
      deck_seed: sessionData.deck_seed,
      total_count: deck.length
    });
  } catch (error) {
    console.error('Error retrieving deck:', error);
    res.status(500).json({
      error: 'Failed to retrieve deck',
      message: error.message
    });
  }
});

/**
 * POST /session/:id/deck
 * Generate deck of places for session
 *
 * Response (200):
 * {
 *   "session_id": string,
 *   "deck": [
 *     {
 *       "place_id": string,
 *       "name": string,
 *       "photo_url": string,
 *       "category": string,
 *       "rating": number | null,
 *       "review_count": number,
 *       "address": string,
 *       "distance_km": number,
 *       "order": number
 *     }
 *   ],
 *   "deck_seed": string,
 *   "total_count": number
 * }
 */
router.post('/session/:id/deck', verifyFirebaseToken, async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.uid;

    const db = getDb();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    // Check if session exists
    if (!sessionDoc.exists) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The session does not exist'
      });
    }

    const sessionData = sessionDoc.data();

    // Check if user is a member of this session
    const memberDoc = await sessionRef.collection('session_members').doc(userId).get();
    if (!memberDoc.exists) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not a member of this session'
      });
    }

    // Check if deck already exists
    if (sessionData.deck_seed) {
      return res.status(400).json({
        error: 'Deck already generated',
        message: 'This session already has a deck. Use GET to retrieve it.'
      });
    }

    const hostLat = sessionData.host_lat;
    const hostLng = sessionData.host_lng;

    // Fetch places from Google Places API
    let places = await fetchPlacesFromGoogle(hostLat, hostLng, 5000); // 5km radius

    // If less than 20 places, retry with larger radius
    if (places.length < 20) {
      console.log(`Only ${places.length} places found with 5km radius, expanding to 10km`);
      places = await fetchPlacesFromGoogle(hostLat, hostLng, 10000); // 10km radius
    }

    // If still no results
    if (places.length === 0) {
      return res.status(404).json({
        error: 'No places found',
        message: 'No restaurants, bars, or cafes found in your area. Try a different location.'
      });
    }

    // Normalize place data
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const normalizedPlaces = places.map(place =>
      normalizePlace(place, hostLat, hostLng, apiKey)
    );

    // Limit to 25 places
    const limitedPlaces = normalizedPlaces.slice(0, 25);

    // Generate deck seed
    const deckSeed = `${hostLat}_${hostLng}_${Date.now()}`;

    // Shuffle places deterministically
    const shuffledPlaces = shuffleWithSeed(limitedPlaces, deckSeed);

    // Add order to each place
    const deck = shuffledPlaces.map((place, index) => ({
      ...place,
      order: index
    }));

    // Update session with deck seed
    await sessionRef.update({
      deck_seed: deckSeed,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Store deck in subcollection
    const batch = db.batch();
    deck.forEach(place => {
      const placeRef = sessionRef.collection('deck').doc(place.place_id);
      batch.set(placeRef, place);
    });
    await batch.commit();

    console.log(`✅ Generated deck with ${deck.length} places for session ${sessionId}`);

    res.status(200).json({
      session_id: sessionId,
      deck: deck,
      deck_seed: deckSeed,
      total_count: deck.length
    });
  } catch (error) {
    console.error('Error generating deck:', error);

    // Check for specific error types
    if (error.message.includes('GOOGLE_PLACES_API_KEY')) {
      return res.status(500).json({
        error: 'API configuration error',
        message: 'Google Places API key is not configured'
      });
    }

    if (error.response && error.response.status === 429) {
      return res.status(429).json({
        error: 'API quota exceeded',
        message: 'Google Places API quota exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Failed to generate deck',
      message: error.message
    });
  }
});

/**
 * POST /session/:id/swipe
 * Submit a swipe for a place
 *
 * Request Body:
 * {
 *   "place_id": string,
 *   "direction": "left" | "right"
 * }
 *
 * Response (200):
 * {
 *   "swipe_id": string,
 *   "session_id": string,
 *   "user_id": string,
 *   "place_id": string,
 *   "direction": string,
 *   "swiped_at": timestamp
 * }
 */
router.post('/session/:id/swipe', verifyFirebaseToken, async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { place_id, direction } = req.body;
    const userId = req.user.uid;

    // Validate input
    if (!place_id || typeof place_id !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'place_id is required and must be a string'
      });
    }

    if (!direction || !['left', 'right'].includes(direction)) {
      return res.status(400).json({
        error: 'Invalid direction',
        message: 'direction must be "left" or "right"'
      });
    }

    const db = getDb();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    // Check if session exists
    if (!sessionDoc.exists) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The session does not exist'
      });
    }

    // Check if user is a member of this session
    const memberDoc = await sessionRef.collection('session_members').doc(userId).get();
    if (!memberDoc.exists) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not a member of this session'
      });
    }

    // Validate place exists in deck
    const placeDoc = await sessionRef.collection('deck').doc(place_id).get();
    if (!placeDoc.exists) {
      return res.status(400).json({
        error: 'Invalid place',
        message: 'place_id does not exist in this session\'s deck'
      });
    }

    // Check for duplicate swipe (prevent re-swiping same card)
    const existingSwipeQuery = await db.collection('swipes')
      .where('session_id', '==', sessionId)
      .where('user_id', '==', userId)
      .where('place_id', '==', place_id)
      .limit(1)
      .get();

    if (!existingSwipeQuery.empty) {
      // Swipe already exists - return 409 Conflict
      const existingSwipe = existingSwipeQuery.docs[0];
      const existingData = existingSwipe.data();

      return res.status(409).json({
        error: 'Duplicate swipe',
        message: 'You have already swiped on this place',
        swipe: {
          swipe_id: existingSwipe.id,
          session_id: existingData.session_id,
          user_id: existingData.user_id,
          place_id: existingData.place_id,
          direction: existingData.direction,
          swiped_at: existingData.swiped_at
        }
      });
    }

    // Create swipe document
    const swipeData = {
      session_id: sessionId,
      user_id: userId,
      place_id: place_id,
      direction: direction,
      swiped_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const swipeRef = await db.collection('swipes').add(swipeData);

    // Return swipe data with server timestamp
    const createdSwipe = await swipeRef.get();
    const createdData = createdSwipe.data();

    res.status(200).json({
      swipe_id: swipeRef.id,
      session_id: createdData.session_id,
      user_id: createdData.user_id,
      place_id: createdData.place_id,
      direction: createdData.direction,
      swiped_at: createdData.swiped_at
    });
  } catch (error) {
    console.error('Error submitting swipe:', error);
    res.status(500).json({
      error: 'Failed to submit swipe',
      message: error.message
    });
  }
});

/**
 * GET /session/:id/status
 * Get session completion status for all users
 *
 * Response (200):
 * {
 *   "session_id": string,
 *   "status": "active" | "completed",
 *   "users": [
 *     {
 *       "user_id": string,
 *       "display_name": string,
 *       "role": "host" | "guest",
 *       "swipes_count": number,
 *       "deck_size": number,
 *       "finished": boolean
 *     },
 *     ...
 *   ]
 * }
 */
router.get('/session/:id/status', verifyFirebaseToken, async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.uid;

    const db = getDb();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    // Check if session exists
    if (!sessionDoc.exists) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The session does not exist'
      });
    }

    const sessionData = sessionDoc.data();

    // Check if user is a member of this session
    const memberDoc = await sessionRef.collection('session_members').doc(userId).get();
    if (!memberDoc.exists) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not a member of this session'
      });
    }

    // Get deck size
    const deckSnapshot = await sessionRef.collection('deck').get();
    const deckSize = deckSnapshot.size;

    // Get all session members
    const membersSnapshot = await sessionRef.collection('session_members').get();
    const users = [];

    for (const memberDoc of membersSnapshot.docs) {
      const memberId = memberDoc.id;
      const memberData = memberDoc.data();

      // Get user profile
      const userProfile = await db.collection('users').doc(memberId).get();

      // Count user's swipes for this session
      const swipesSnapshot = await db.collection('swipes')
        .where('session_id', '==', sessionId)
        .where('user_id', '==', memberId)
        .get();

      const swipesCount = swipesSnapshot.size;
      const finished = swipesCount >= deckSize;

      users.push({
        user_id: memberId,
        display_name: userProfile.data()?.display_name || 'Unknown',
        role: memberData.role,
        swipes_count: swipesCount,
        deck_size: deckSize,
        finished: finished
      });
    }

    // Determine overall session status
    const allFinished = users.every(u => u.finished);
    const overallStatus = allFinished ? 'completed' : 'active';

    res.status(200).json({
      session_id: sessionId,
      status: overallStatus,
      users: users
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      error: 'Failed to get session status',
      message: error.message
    });
  }
});

module.exports = router;
