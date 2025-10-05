require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

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
      session: '/api/v1/session (coming soon)',
      places: '/api/v1/places (coming soon)'
    }
  });
});

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
