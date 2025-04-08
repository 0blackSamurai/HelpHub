const Message = require('../models/messageModel');
const Ticket = require('../models/ticketModel');

// Get unread messages count and preview for a user
exports.getUnreadMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get unread messages for this user
        const messages = await Message.find({ 
            userId: userId,
            read: false 
        })
        .populate({
            path: 'ticketId',
            select: 'title'
        })
        .sort({ createdAt: -1 });
        
        // Format messages for display
        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            text: msg.message,
            ticketId: msg.ticketId._id,
            ticketTitle: msg.ticketId.title,
            date: msg.createdAt
        }));
        
        // Return count and message previews
        res.json({
            count: messages.length,
            messages: formattedMessages
        });
    } catch (error) {
        console.error('Error fetching unread messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    try {
        const messageId = req.params.id;
        
        const result = await Message.findByIdAndUpdate(
            messageId,
            { read: true },
            { new: true }
        );
        
        if (!result) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.status(200).json({ message: 'Message marked as read' });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ error: 'Failed to update message' });
    }
};

// Mark all messages for a user as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        await Message.updateMany(
            { userId: userId, read: false },
            { read: true }
        );
        
        res.status(200).json({ message: 'All messages marked as read' });
    } catch (error) {
        console.error('Error marking all messages as read:', error);
        res.status(500).json({ error: 'Failed to update messages' });
    }
};
