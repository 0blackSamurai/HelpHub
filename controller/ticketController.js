const Ticket = require('../models/ticketModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel'); // Add import for User model

exports.createTicket = async (req, res) => {
    const { title, description, category, priority } = req.body;
    try {
        const newTicket = new Ticket({
            userId: req.user.userId, // Associate ticket with logged-in user
            title, // Save title
            description,
            category,
            priority // Save priority
        });
        await newTicket.save();
        res.redirect('/profile'); // Redirect to profile after creating the ticket
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).send('Error creating ticket');
    }
};

exports.getTickets = async (req, res) => {
    try {
        const tickets = req.user.role === 'Admin'
            ? await Ticket.find().populate('userId')
            : await Ticket.find({ userId: req.user.userId });
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).send('Error fetching tickets');
    }
};

exports.getAllTicketsForAdmin = async (req, res) => {
    try {
        const tickets = await Ticket.find().populate('userId');
        res.render('dashboard', { title: 'Admin Dashboard', tickets });
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        res.status(500).send('Error fetching tickets');
    }
};

exports.updateTicketStatus = async (req, res) => {
    const { ticketId, status } = req.body;
    try {
        await Ticket.findByIdAndUpdate(ticketId, { status });
        res.redirect('/dashboard'); // Redirect back to the dashboard
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).send('Error updating ticket status');
    }
};

exports.getUserTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ userId: req.user.userId }); // Fetch tickets for the logged-in user
        res.render('profile', { title: 'Profile', tickets });
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).send('Error fetching tickets');
    }
};

exports.renderCreateTicketPage = (req, res) => {
    res.render('createTicket', { title: 'Create Ticket' });
};

exports.editTicket = async (req, res) => {
    console.log("Request Headers:", req.headers); // Debugging log
    console.log("Request Body:", req.body); // Debugging log

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('Invalid request body'); // Handle empty body
    }

    const { ticketId, title, description, priority, status, userComment, adminComment } = req.body;

    try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            console.error("Ticket not found with ID:", ticketId); // Debugging log
            return res.status(404).send('Ticket not found');
        }

        ticket.title = title;
        ticket.description = description;
        ticket.priority = priority;
        ticket.status = status;

        if (userComment) {
            ticket.comments.push({ userId: req.user.userId, message: userComment });
        }

        if (adminComment && req.user.role === 'Admin') {
            ticket.comments.push({ userId: req.user.userId, message: adminComment });
        }

        await ticket.save();
        console.log("Ticket updated successfully:", ticket); // Debugging log
        res.status(200).send('Ticket updated successfully');
    } catch (error) {
        console.error('Error editing ticket:', error); // Debugging log
        res.status(500).send('Error editing ticket');
    }
};

exports.viewTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await Ticket.findById(ticketId).populate({
            path: 'comments.userId',
            select: 'username role' // Added role to the selection
        });
        
        if (!ticket) {
            return res.status(404).send('Ticket not found');
        }
        
        res.render('ticketView', { 
            title: 'View Ticket', 
            ticket,
            userId: req.user.userId 
        });
    } catch (error) {
        console.error('Error viewing ticket:', error);
        res.status(500).send('Error viewing ticket');
    }
};

exports.addComment = async (req, res) => {
    try {
        const { ticketId, comment } = req.body;
        
        if (!comment || !ticketId) {
            return res.status(400).send('Missing required fields');
        }
        
        const ticket = await Ticket.findById(ticketId).populate('userId', 'username');
        
        if (!ticket) {
            return res.status(404).send('Ticket not found');
        }
        
        // Add the comment
        const newComment = {
            userId: req.user.userId,
            message: comment
        };
        
        ticket.comments.push(newComment);
        await ticket.save();
        
        // Create notification for ticket owner if comment was not made by the ticket owner
        if (ticket.userId._id.toString() !== req.user.userId) {
            const message = new Message({
                userId: ticket.userId._id,
                ticketId: ticket._id,
                commentId: ticket.comments[ticket.comments.length - 1]._id,
                message: `New comment on your ticket: "${ticket.title}"`
            });
            
            await message.save();
        }
        
        // Create notifications for all admin users
        const adminUsers = await User.find({ role: 'Admin' });
        
        // Create promises array for all admin notifications
        const adminNotifications = adminUsers.map(async (admin) => {
            // Skip if the admin is the one who made the comment
            if (admin._id.toString() === req.user.userId) {
                return;
            }
            
            // Skip if the admin is the ticket owner (to avoid duplicate notifications)
            if (admin._id.toString() === ticket.userId._id.toString()) {
                return;
            }
            
            const adminMessage = new Message({
                userId: admin._id,
                ticketId: ticket._id,
                commentId: ticket.comments[ticket.comments.length - 1]._id,
                message: `New comment by ${req.user.username || 'a user'} on ticket: "${ticket.title}"`
            });
            
            return adminMessage.save();
        });
        
        // Execute all admin notification saves
        await Promise.all(adminNotifications.filter(Boolean));
        
        res.redirect(`/tickets/view/${ticketId}`);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).send('Error adding comment');
    }
};
