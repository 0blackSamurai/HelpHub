const express = require('express');
const router = express.Router();
const ticketController = require('../controller/ticketController');
const { isAuthenticated, isAdmin, isSupportStaff } = require('../middleware/authMiddleware');

// Regular ticket routes
router.get('/create', isAuthenticated, ticketController.renderCreateTicketPage);
router.post('/create', isAuthenticated, ticketController.createTicket);
router.get('/all', isAuthenticated, ticketController.getTickets);
router.put('/update-status', isAuthenticated, ticketController.updateTicketStatus);
router.get('/dashboard', isAuthenticated, isAdmin, ticketController.getAllTicketsForAdmin);
router.post('/edit', isAuthenticated, ticketController.editTicket);
router.delete('/delete/:id', isAuthenticated, isAdmin, ticketController.deleteTicket);
router.get('/view/:id', isAuthenticated, ticketController.viewTicket);
router.post('/comment', isAuthenticated, ticketController.addComment);

// Assignment and analytics routes
router.post('/assign', isAuthenticated, isAdmin, ticketController.assignTicket);
router.get('/statistics', isAuthenticated, isAdmin, ticketController.getTicketStatistics);
router.get('/analytics', isAuthenticated, isAdmin, ticketController.renderAdminAnalytics);

// Support staff dashboard route
router.get('/support-dashboard', isAuthenticated, isSupportStaff, ticketController.getSupportDashboard);
router.put('/update-assigned', isAuthenticated, isSupportStaff, ticketController.updateAssignedTicket);

// Feedback routes - Fix the userId parameter format
router.post('/feedback', isAuthenticated, ticketController.submitFeedback);
router.get('/feedback/check/:ticketId', isAuthenticated, ticketController.checkFeedbackEligibility);
router.get('/feedback/stats', isAuthenticated, ticketController.getFeedbackStats); // Remove the optional parameter
router.get('/feedback/stats/:userId', isAuthenticated, ticketController.getFeedbackStats); // Make it a separate route

module.exports = router;
