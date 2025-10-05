const admin = require('firebase-admin');

/**
 * Middleware to verify Firebase ID tokens
 * Extracts token from Authorization header and validates it
 * Adds decoded user info to req.user
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header missing',
        message: 'Please provide a valid Firebase ID token',
      });
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization format',
        message: 'Expected format: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verify the token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Add user info to request object for use in route handlers
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      // Add any other claims you need
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.',
      });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is malformed.',
      });
    }

    // Generic error response
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Optional middleware to verify token but don't fail if missing
 * Useful for routes that have optional authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      req.user = null;
      return next();
    }

    const token = parts[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    // If token is invalid, just set user to null and continue
    req.user = null;
    next();
  }
};

module.exports = {
  verifyFirebaseToken,
  optionalAuth,
};
