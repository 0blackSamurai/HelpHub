const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const authController = require('../controller/authController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const ticketController = require('../controller/ticketController');

// Login page
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// Register page
router.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

// Login process - Use the controller's login function instead
router.post('/login', authController.login);

// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('user');
    res.redirect('/login');
});

// Register process
router.post('/register', async (req, res) => {
    try {
        const { username, epost, passord } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ epost }, { username }] 
        }).lean();
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User with this email or username already exists' 
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passord, salt);
        
        // Create new user
        const newUser = new User({
            username,
            epost,
            passord: hashedPassword,
            role: 'User' // Default role
        });
        
        await newUser.save();
        
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

router.get('/profile', isAuthenticated, ticketController.getUserTickets); // Use getUserTickets for profile

router.get('/dashboard', isAuthenticated, isAdmin, (req, res) => {
    res.redirect('/tickets/dashboard');
});

module.exports = router;