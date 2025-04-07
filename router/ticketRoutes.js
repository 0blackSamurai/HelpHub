const express = require('express');
const router = express.Router();
const ticketController = require('../controller/ticketController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.get('/create', isAuthenticated, ticketController.renderCreateTicketPage);
router.post('/create', isAuthenticated, ticketController.createTicket);
router.get('/all', isAuthenticated, ticketController.getTickets);
router.put('/update-status', isAuthenticated, isAdmin, ticketController.updateTicketStatus);
router.get('/dashboard', isAuthenticated, isAdmin, ticketController.getAllTicketsForAdmin);
router.post('/edit', isAuthenticated, ticketController.editTicket);

// New routes for viewing tickets and comments
router.get('/view/:id', isAuthenticated, ticketController.viewTicket);
router.post('/comment', isAuthenticated, ticketController.addComment);

module.exports = router;
