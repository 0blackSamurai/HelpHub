const express = require('express');
const router = express.Router();
const messageController = require('../controller/messageController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Get unread messages for the current user
router.get('/unread', isAuthenticated, messageController.getUnreadMessages);

// Mark a specific message as read
router.put('/read/:id', isAuthenticated, messageController.markAsRead);

// Mark all messages as read for the current user
router.put('/read-all', isAuthenticated, messageController.markAllAsRead);

module.exports = router;
