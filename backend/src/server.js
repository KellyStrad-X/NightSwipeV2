require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeFirebase } = require('./config/firebase');
const { verifyFirebaseToken } = require('./middleware/auth');
const sessionRoutes = require('./routes/session');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
initializeFirebase();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NightSwipe API'
  });
});

// API routes placeholder
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'NightSwipe API v1',
    endpoints: {
      health: '/health',
      profile: '/api/v1/profile (protected)',
      session_create: 'POST /api/v1/session (protected)',
      session_join: 'POST /api/v1/session/:id/join (protected)',
      session_get: 'GET /api/v1/session/:id (protected)',
      places: '/api/v1/places (coming soon)'
    }
  });
});

// Protected route example - requires Firebase authentication
app.get('/api/v1/profile', verifyFirebaseToken, (req, res) => {
  res.json({
    message: 'Protected profile endpoint',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      emailVerified: req.user.emailVerified,
    }
  });
});

// Session routes
app.use('/api/v1', sessionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ NightSwipe API running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
