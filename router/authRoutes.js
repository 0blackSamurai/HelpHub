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

// Login process - Optimized for performance
router.post('/login', async (req, res) => {
    try {
        const { epost, passord } = req.body;
        
        // Find user by email - with lean() for faster query
        const user = await User.findOne({ epost }).lean();
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(passord, user.passord);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // Set cookie - Changed from 'token' to 'user' for consistency
        res.cookie('user', token, {
            httpOnly: true,
            maxAge: 3600000 // 1 hour
        });
        
        // Redirect based on role
        if (user.role === 'Admin') {
            return res.redirect('/dashboard');
        } else if (user.role === '1st Line' || user.role === '2nd Line') {
            return res.redirect('/tickets/support-dashboard');
        } else {
            return res.redirect('/tickets/my-tickets');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login. Please try again.' });
    }
});

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