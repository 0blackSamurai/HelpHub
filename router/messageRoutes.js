const express = require('express');
const router = express.Router();
const messageController = require('../controller/messageController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Get unread messages count and preview for the current user
router.get('/unread', isAuthenticated, messageController.getUnreadMessages);

// Mark a message as read
router.put('/read/:id', isAuthenticated, messageController.markAsRead);

// Mark all messages as read
router.put('/read-all', isAuthenticated, messageController.markAllAsRead);

module.exports = router;
