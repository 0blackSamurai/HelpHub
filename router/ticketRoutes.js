const express = require('express');
const router = express.Router();
const ticketController = require('../controller/ticketController');
const { isAuthenticated, isAdmin, isSupportStaff } = require('../middleware/authMiddleware');

router.get('/create', isAuthenticated, ticketController.renderCreateTicketPage);
router.post('/create', isAuthenticated, ticketController.createTicket);
router.get('/all', isAuthenticated, ticketController.getTickets);
router.put('/update-status', isAuthenticated, isAdmin, ticketController.updateTicketStatus);
router.get('/dashboard', isAuthenticated, isAdmin, ticketController.getAllTicketsForAdmin);
router.post('/edit', isAuthenticated, ticketController.editTicket);
router.delete('/delete/:id', isAuthenticated, isAdmin, ticketController.deleteTicket);
router.get('/view/:id', isAuthenticated, ticketController.viewTicket);
router.post('/comment', isAuthenticated, ticketController.addComment);

// New routes for ticket assignment and analytics
router.post('/assign', isAuthenticated, isAdmin, ticketController.assignTicket);
router.get('/statistics', isAuthenticated, isAdmin, ticketController.getTicketStatistics);
router.get('/analytics', isAuthenticated, isAdmin, ticketController.renderAdminAnalytics);

// Support staff dashboard route
router.get('/support-dashboard', isAuthenticated, isSupportStaff, ticketController.getSupportDashboard);

module.exports = router;
