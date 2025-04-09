const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Render the index page
router.get('/', (req, res) => {
    res.render('index', { title: 'Welcome' });
});

// User management routes (admin only)
router.get('/users', isAuthenticated, isAdmin, userController.getAllUsers);
router.put('/users/role', isAuthenticated, isAdmin, userController.updateUserRole);
router.get('/users/support-staff', isAuthenticated, isAdmin, userController.getSupportStaff);
router.get('/user-management', isAuthenticated, isAdmin, userController.renderUserManagement);
router.delete('/users/:userId', isAuthenticated, isAdmin, userController.deleteUser);

// User manual/help routes
router.get('/help', isAuthenticated, (req, res) => {
    res.render('userManual', { 
        title: 'User Manual',
        userRole: req.user.role
    });
});

module.exports = router;
