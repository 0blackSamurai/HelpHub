const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const helmet = require('helmet'); // Add Helmet for security headers
const rateLimit = require('express-rate-limit'); // Add rate limiting
const cors = require('cors'); // Add CORS protection
require('dotenv').config();

const { setAuthStatus } = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./router/authRoutes');
const userRoutes = require('./router/userRoutes');
const ticketRoutes = require('./router/ticketRoutes');
const messageRoutes = require('./router/messageRoutes');
const securityRoutes = require('./router/securityRoutes'); // Add this line

// Initialize app
const app = express();

// Configure multer
const upload = multer();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiter to all requests
app.use(limiter);

// Apply more strict rate limiting to authentication routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many login attempts, please try again later'
});

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3005', // Be explicit about origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Use Helmet with more permissive CSP for cookies
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  },
  // Don't block cookies
  crossOriginEmbedderPolicy: false
}));

// Middleware - ensure these are in correct order
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(upload.none()); // Parse multipart/form-data
app.use(setAuthStatus); // Apply auth status middleware

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log("✅ Database connection successful");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });

// Apply auth rate limiter to login and register routes
app.use('/login', authLimiter);
app.use('/register', authLimiter);

// Routes
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/tickets', ticketRoutes);
app.use('/messages', messageRoutes);
app.use('/admin', securityRoutes); // Add this line

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err : {} 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Not Found',
    message: 'Page not found', 
    error: {} 
  });
});

// Start the server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});