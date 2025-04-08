const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');
require('dotenv').config();

const { setAuthStatus } = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./router/authRoutes');
const userRoutes = require('./router/userRoutes');
const ticketRoutes = require('./router/ticketRoutes');
const messageRoutes = require('./router/messageRoutes'); // Add this line

// Initialize app
const app = express();

// Configure multer
const upload = multer();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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

// Routes
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/tickets', ticketRoutes);
app.use('/messages', messageRoutes); // Add this line

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