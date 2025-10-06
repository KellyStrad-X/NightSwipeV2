const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const crypto = require('crypto');
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

module.exports = router;
