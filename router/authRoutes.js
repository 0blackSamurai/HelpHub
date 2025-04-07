const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const ticketController = require('../controller/ticketController');

router.get('/register', authController.renderRegisterPage);
router.post('/register', authController.register);

router.get('/login', authController.renderLoginPage);
router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.get('/profile', isAuthenticated, ticketController.getUserTickets); // Use getUserTickets for profile

router.get('/dashboard', isAuthenticated, isAdmin, (req, res) => {
    res.redirect('/tickets/dashboard');
});

module.exports = router;