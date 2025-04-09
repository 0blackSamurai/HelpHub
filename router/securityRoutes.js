const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/authMiddleware');

// Security info endpoint - only accessible to admins
router.get('/security-info', isAdmin, (req, res) => {
  res.json({
    security: {
      helmet: 'Active with custom CSP configuration',
      rateLimit: {
        general: '100 requests per 15 minutes',
        auth: '10 requests per hour'
      },
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      }
    }
  });
});

module.exports = router;
