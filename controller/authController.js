const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, epost, passord, confirmpassord } = req.body;

    try {
        // Validate input
        if (!username || !epost || !passord || !confirmpassord) {
            return res.status(400).send('All fields are required');
        }

        if (passord !== confirmpassord) {
            return res.status(400).send('Passwords do not match');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ epost }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).send('User with this email or username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(passord, parseInt(process.env.SALTROUNDS));

        // Create new user
        const newUser = new User({
            username,
            epost,
            passord: hashedPassword,
            role: 'User' // Default role
        });

        await newUser.save();
        
        // Auto-login after registration
        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '48h' }
        );
        
        res.cookie('user', token, { httpOnly: true });
        res.redirect('/profile');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
};

exports.login = async (req, res) => {
    const { epost, passord } = req.body;
    
    try {
        // Find user by email
        const user = await User.findOne({ epost });

        if (!user) {
            // Check if request expects JSON
            if (req.is('application/json') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(400).json({ success: false, message: 'User not found' });
            }
            return res.status(400).send('User not found');
        }

        // Compare password
        const isMatch = await bcrypt.compare(passord, user.passord);

        if (!isMatch) {
            // Check if request expects JSON
            if (req.is('application/json') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(400).json({ success: false, message: 'Invalid password' });
            }
            return res.status(400).send('Invalid password');
        }

        // Create and set token
        const token = jwt.sign(
            { userId: user._id, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '48h' }
        );
        
        // Set cookie with secure options
        res.cookie('user', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only use secure in production
            sameSite: 'lax', // Helps with CSRF protection
            maxAge: 48 * 60 * 60 * 1000 // 48 hours in milliseconds
        });
        
        console.log('Login successful for:', user.username);
        
        // Determine redirect URL based on user role
        const redirectUrl = user.role === 'Admin' ? '/tickets/dashboard' : '/profile';
        
        // Handle different response formats based on request
        if (req.is('application/json') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            console.log('Sending JSON response');
            return res.status(200).json({ 
                success: true, 
                message: 'Login successful',
                redirectUrl: redirectUrl
            });
        } else {
            console.log('Redirecting to:', redirectUrl);
            return res.redirect(redirectUrl);
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Also handle JSON vs HTML responses for errors
        if (req.is('application/json') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(500).json({ 
                success: false, 
                message: 'An error occurred during login',
                error: error.message
            });
        }
        
        res.status(500).send('An error occurred during login');
    }
};

exports.logout = (req, res) => {
    try {
      res.clearCookie('user');
      res.redirect('/login');
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).send('An error occurred during logout');
    }
};

exports.renderRegisterPage = (req, res) => {
    // If already logged in, redirect to profile
    if (res.locals.isAuthenticated) {
        return res.redirect('/profile');
    }
    res.render('register', { title: 'Create Account' });
};

exports.renderLoginPage = (req, res) => {
    // If already logged in, redirect to profile
    if (res.locals.isAuthenticated) {
        return res.redirect('/profile');
    }
    res.render('login', { title: 'Login' });
};

exports.renderDashboardPage = (req, res) => {
    res.render('dashboard', { title: 'Admin Dashboard' });
};

exports.renderProfilePage = (req, res) => {
    res.render('profile', { title: 'Your Profile' });
};
