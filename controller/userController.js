const User = require('../models/userModel');
const Ticket = require('../models/ticketModel');

// Get all users (for admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passord');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Update user role (for admin)
exports.updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        
        if (!userId || !role) {
            return res.status(400).json({ error: 'User ID and role are required' });
        }
        
        // Check if role is valid
        const validRoles = ['Admin', 'User', '1st Line', '2nd Line'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-passord');
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

// Get support staff (1st Line and 2nd Line)
exports.getSupportStaff = async (req, res) => {
    try {
        const supportStaff = await User.find({
            role: { $in: ['1st Line', '2nd Line'] }
        }).select('-passord');
        
        res.status(200).json(supportStaff);
    } catch (error) {
        console.error('Error fetching support staff:', error);
        res.status(500).json({ error: 'Failed to fetch support staff' });
    }
};

// Render user management page (admin only)
exports.renderUserManagement = async (req, res) => {
    try {
        const users = await User.find().select('-passord');
        res.render('userManagement', { 
            title: 'User Management',
            users 
        });
    } catch (error) {
        console.error('Error rendering user management:', error);
        res.status(500).send('Server error');
    }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Check if the user exists
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Prevent admins from deleting themselves
        if (userId === req.user.userId) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }
        
        // Check if user has tickets
        const userTickets = await Ticket.countDocuments({ userId: userId });
        
        if (userTickets > 0) {
            return res.status(400).json({ 
                error: 'This user has active tickets. Please reassign or resolve them before deleting the user.'
            });
        }
        
        // Delete the user
        await User.findByIdAndDelete(userId);
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
