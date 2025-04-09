const Ticket = require('../models/ticketModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel'); // Fixed missing closing parenthesis
const Feedback = require('../models/feedbackModel');

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

// Modified addComment to notify ticket owner and assigned support staff
exports.addComment = async (req, res) => {
    try {
        const { ticketId, comment } = req.body;
        
        if (!comment || !ticketId) {
            return res.status(400).send('Missing required fields');
        }
        
        const ticket = await Ticket.findById(ticketId)
            .populate('userId', 'username')
            .populate('assignedTo', 'username role _id');
        
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
        
        // Create notifications based on who commented:
        const commenterId = req.user.userId;
        const commenterRole = req.user.role;
        
        // 1. If a regular user commented on their own ticket with an assigned support staff
        if (ticket.userId._id.toString() === commenterId && ticket.assignedTo) {
            // Notify the assigned support staff
            const message = new Message({
                userId: ticket.assignedTo._id,
                ticketId: ticket._id,
                commentId: ticket.comments[ticket.comments.length - 1]._id,
                message: `New comment from ticket owner on your assigned ticket: "${ticket.title}"`
            });
            
            await message.save();
        }
        
        // 2. If support staff commented on a ticket
        else if ((commenterRole === '1st Line' || commenterRole === '2nd Line') && 
                 ticket.userId._id.toString() !== commenterId) {
            // Notify the ticket owner
            const message = new Message({
                userId: ticket.userId._id,
                ticketId: ticket._id,
                commentId: ticket.comments[ticket.comments.length - 1]._id,
                message: `New comment from support staff on your ticket: "${ticket.title}"`
            });
            
            await message.save();
        }
        
        // 3. If someone else commented (like admin), notify both owner and assigned staff
        else if (ticket.userId._id.toString() !== commenterId) {
            // Notify the ticket owner
            const ownerMessage = new Message({
                userId: ticket.userId._id,
                ticketId: ticket._id,
                commentId: ticket.comments[ticket.comments.length - 1]._id,
                message: `New comment on your ticket: "${ticket.title}"`
            });
            
            await ownerMessage.save();
            
            // If ticket is assigned, notify the support staff as well
            if (ticket.assignedTo && ticket.assignedTo._id.toString() !== commenterId) {
                const staffMessage = new Message({
                    userId: ticket.assignedTo._id,
                    ticketId: ticket._id,
                    commentId: ticket.comments[ticket.comments.length - 1]._id,
                    message: `New comment on your assigned ticket: "${ticket.title}"`
                });
                
                await staffMessage.save();
            }
        }
        
        res.redirect(`/tickets/view/${ticketId}`);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).send('Error adding comment');
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the ticket
        const ticket = await Ticket.findById(id);
        
        if (!ticket) {
            return res.status(404).send('Ticket not found');
        }
        
        // Verify the ticket is either 'Løst' (Resolved) or 'Closed'
        if (ticket.status !== 'Løst' && ticket.status !== 'Closed') {
            return res.status(403).send('Only resolved or closed tickets can be deleted');
        }
        
        // Delete the ticket
        await Ticket.findByIdAndDelete(id);
        
        // Return success response
        return res.status(200).send('Ticket deleted successfully');
    } catch (error) {
        console.error('Error deleting ticket:', error);
        return res.status(500).send('Server error while deleting ticket');
    }
};

// Update assign ticket to notify only relevant support staff
exports.assignTicket = async (req, res) => {
    try {
        const { ticketId, userId, role } = req.body;
        
        if (!ticketId || !userId || !role) {
            return res.status(400).json({ error: 'Ticket ID, User ID, and role are required' });
        }
        
        const ticket = await Ticket.findById(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // Update the ticket with assignment info
        ticket.assignedTo = userId;
        ticket.assignedRole = role;
        
        // Update status to "Under arbeid" if it's "Åpen"
        if (ticket.status === 'Åpen') {
            ticket.status = 'Under arbeid';
        }
        
        await ticket.save();
        
        // Create a notification for the assigned user
        const message = new Message({
            userId: userId,
            ticketId: ticketId,
            message: `You have been assigned to ticket: "${ticket.title}"`
        });
        
        await message.save();
        
        res.status(200).json({ message: 'Ticket assigned successfully' });
    } catch (error) {
        console.error('Error assigning ticket:', error);
        res.status(500).json({ error: 'Failed to assign ticket' });
    }
};

// Get tickets assigned to the logged-in support staff
exports.getSupportDashboard = async (req, res) => {
    try {
        // Find tickets assigned to this support staff
        const assignedTickets = await Ticket.find({ 
            assignedTo: req.user.userId 
        }).populate('userId');
        
        // Find other tickets (for reference)
        const otherTickets = await Ticket.find({ 
            assignedRole: req.user.role,
            assignedTo: { $ne: req.user.userId } 
        }).populate('userId').limit(10);
        
        // Ticket counts and stats
        const totalAssigned = assignedTickets.length;
        const inProgress = assignedTickets.filter(t => t.status === 'Under arbeid').length;
        const resolved = assignedTickets.filter(t => t.status === 'Løst').length;
        const closed = assignedTickets.filter(t => t.status === 'Closed').length;
        
        res.render('supportDashboard', {
            title: `${req.user.role} Dashboard`,
            assignedTickets,
            otherTickets,
            stats: {
                totalAssigned,
                inProgress,
                resolved,
                closed,
                resolution: totalAssigned > 0 ? Math.round(((resolved + closed) / totalAssigned) * 100) : 0
            },
            role: req.user.role
        });
    } catch (error) {
        console.error('Error loading support dashboard:', error);
        res.status(500).send('Server error');
    }
};

// Get ticket statistics for admin dashboard
exports.getTicketStatistics = async (req, res) => {
    try {
        // Get total tickets count
        const totalTickets = await Ticket.countDocuments();
        
        // Get tickets by status
        const openTickets = await Ticket.countDocuments({ status: 'Åpen' });
        const inProgressTickets = await Ticket.countDocuments({ status: 'Under arbeid' });
        const resolvedTickets = await Ticket.countDocuments({ status: 'Løst' });
        const closedTickets = await Ticket.countDocuments({ status: 'Closed' });
        
        // Get tickets by support level
        const firstLineTickets = await Ticket.countDocuments({ assignedRole: '1st Line' });
        const firstLineResolved = await Ticket.countDocuments({ 
            assignedRole: '1st Line', 
            status: { $in: ['Løst', 'Closed'] }
        });
        
        const secondLineTickets = await Ticket.countDocuments({ assignedRole: '2nd Line' });
        const secondLineResolved = await Ticket.countDocuments({ 
            assignedRole: '2nd Line', 
            status: { $in: ['Løst', 'Closed'] }
        });
        
        // Get unassigned tickets
        const unassignedTickets = await Ticket.countDocuments({ assignedTo: null });
        
        // Return statistics
        res.status(200).json({
            total: totalTickets,
            byStatus: {
                open: openTickets,
                inProgress: inProgressTickets,
                resolved: resolvedTickets,
                closed: closedTickets
            },
            bySupport: {
                firstLine: {
                    total: firstLineTickets,
                    resolved: firstLineResolved
                },
                secondLine: {
                    total: secondLineTickets,
                    resolved: secondLineResolved
                },
                unassigned: unassignedTickets
            }
        });
    } catch (error) {
        console.error('Error getting ticket statistics:', error);
        res.status(500).json({ error: 'Failed to get ticket statistics' });
    }
};

// Render admin analytics page
exports.renderAdminAnalytics = async (req, res) => {
    try {
        // Get ticket statistics
        const totalTickets = await Ticket.countDocuments();
        
        // Get tickets by status
        const openTickets = await Ticket.countDocuments({ status: 'Åpen' });
        const inProgressTickets = await Ticket.countDocuments({ status: 'Under arbeid' });
        const resolvedTickets = await Ticket.countDocuments({ status: 'Løst' });
        const closedTickets = await Ticket.countDocuments({ status: 'Closed' });
        
        // Get tickets by support level
        const firstLineTickets = await Ticket.countDocuments({ assignedRole: '1st Line' });
        const firstLineResolved = await Ticket.countDocuments({ 
            assignedRole: '1st Line', 
            status: { $in: ['Løst', 'Closed'] }
        });
        
        const secondLineTickets = await Ticket.countDocuments({ assignedRole: '2nd Line' });
        const secondLineResolved = await Ticket.countDocuments({ 
            assignedRole: '2nd Line', 
            status: { $in: ['Løst', 'Closed'] }
        });
        
        // Get unassigned tickets
        const unassignedTickets = await Ticket.countDocuments({ assignedTo: null });
        
        // Render the analytics page with data
        res.render('adminAnalytics', {
            title: 'Support Analytics',
            stats: {
                total: totalTickets,
                byStatus: {
                    open: openTickets,
                    inProgress: inProgressTickets,
                    resolved: resolvedTickets,
                    closed: closedTickets
                },
                bySupport: {
                    firstLine: {
                        total: firstLineTickets,
                        resolved: firstLineResolved
                    },
                    secondLine: {
                        total: secondLineTickets,
                        resolved: secondLineResolved
                    },
                    unassigned: unassignedTickets
                }
            }
        });
    } catch (error) {
        console.error('Error rendering analytics page:', error);
        res.status(500).send('Server error');
    }
};

// Allow support staff to update tickets assigned to them
exports.updateAssignedTicket = async (req, res) => {
    try {
        const { ticketId, status, comment } = req.body;
        
        // Find the ticket
        const ticket = await Ticket.findById(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // Verify the user is assigned to this ticket
        if (!ticket.assignedTo || ticket.assignedTo.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'You are not authorized to update this ticket' });
        }
        
        // Update the ticket status
        if (status && status !== ticket.status) {
            ticket.status = status;
        }
        
        // Add a comment if provided
        if (comment && comment.trim() !== '') {
            ticket.comments.push({
                userId: req.user.userId,
                message: comment
            });
            
            // Create notification for ticket owner
            const message = new Message({
                userId: ticket.userId,
                ticketId: ticket._id,
                commentId: ticket.comments[ticket.comments.length - 1]._id,
                message: `Support staff updated your ticket: "${ticket.title}"`
            });
            
            await message.save();
        }
        
        await ticket.save();
        
        res.status(200).json({ message: 'Ticket updated successfully' });
    } catch (error) {
        console.error('Error updating assigned ticket:', error);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
};

// Submit feedback for a resolved ticket
exports.submitFeedback = async (req, res) => {
    try {
        const { ticketId, rating, comment } = req.body;
        const userId = req.user.userId;
        
        // Find the ticket
        const ticket = await Ticket.findById(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // Make sure the ticket belongs to this user
        if (ticket.userId.toString() !== userId) {
            return res.status(403).json({ error: 'You can only provide feedback for your own tickets' });
        }
        
        // Make sure the ticket is resolved or closed
        if (ticket.status !== 'Løst' && ticket.status !== 'Closed') {
            return res.status(400).json({ error: 'You can only provide feedback for resolved or closed tickets' });
        }
        
        // Create or update feedback
        await Feedback.findOneAndUpdate(
            { ticketId, userId },
            { rating, comment },
            { upsert: true, new: true }
        );
        
        // If the ticket is "Løst", automatically change it to "Closed" after feedback
        if (ticket.status === 'Løst') {
            ticket.status = 'Closed';
            await ticket.save();
            
            // If there was a support staff assigned, notify them
            if (ticket.assignedTo) {
                const message = new Message({
                    userId: ticket.assignedTo,
                    ticketId: ticket._id,
                    message: `Ticket "${ticket.title}" has been closed after receiving customer feedback.`
                });
                
                await message.save();
            }
        }
        
        res.status(200).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
};

// Check if user can provide feedback
exports.checkFeedbackEligibility = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user.userId;
        
        // Find the ticket
        const ticket = await Ticket.findById(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // Check if user owns the ticket
        if (ticket.userId.toString() !== userId) {
            return res.status(200).json({ eligible: false });
        }
        
        // Check if ticket is resolved or closed
        if (ticket.status !== 'Løst' && ticket.status !== 'Closed') {
            return res.status(200).json({ eligible: false });
        }
        
        // Check if feedback already exists
        const existingFeedback = await Feedback.findOne({ ticketId, userId });
        
        res.status(200).json({ 
            eligible: ticket.status === 'Løst' || !existingFeedback,
            hasFeedback: !!existingFeedback,
            feedbackData: existingFeedback
        });
    } catch (error) {
        console.error('Error checking feedback eligibility:', error);
        res.status(500).json({ error: 'Failed to check feedback eligibility' });
    }
};

// Get feedback statistics for support staff or admin
exports.getFeedbackStats = async (req, res) => {
    try {
        // Get userId from params or set to null if not provided
        const userId = req.params.userId || null;
        
        let match = {};
        
        // If userId is provided, get feedback for tickets assigned to that user
        if (userId) {
            // Get tickets assigned to this user
            const tickets = await Ticket.find({ assignedTo: userId });
            const ticketIds = tickets.map(ticket => ticket._id);
            
            match = { ticketId: { $in: ticketIds } };
        }
        
        // Aggregate feedback statistics
        const stats = await Feedback.aggregate([
            { $match: match },
            { 
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                    ratings: {
                        $push: "$rating"
                    }
                }
            }
        ]);
        
        if (stats.length === 0) {
            return res.status(200).json({ 
                averageRating: 0,
                count: 0,
                ratingCounts: {
                    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
                }
            });
        }
        
        // Count occurrences of each rating
        const ratingCounts = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        };
        
        stats[0].ratings.forEach(rating => {
            ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        });
        
        res.status(200).json({
            averageRating: Math.round(stats[0].averageRating * 10) / 10, // round to 1 decimal place
            count: stats[0].count,
            ratingCounts
        });
    } catch (error) {
        console.error('Error getting feedback stats:', error);
        res.status(500).json({ error: 'Failed to get feedback statistics' });
    }
};
