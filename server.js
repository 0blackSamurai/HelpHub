const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { setAuthStatus } = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./router/authRoutes');
const userRoutes = require('./router/userRoutes');
const ticketRoutes = require('./router/ticketRoutes');

// Initialize app
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(setAuthStatus); // Ensure this middleware is applied before defining routes

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// Routes
app.use('/', authRoutes); // Use '/' for authentication routes
app.use('/', userRoutes); // Use '/' for user routes
app.use('/tickets', ticketRoutes); // Use '/tickets' for ticket routes

// Start the server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});