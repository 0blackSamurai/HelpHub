# HelpHub - Ticket Management System

HelpHub is a comprehensive ticket management system designed to handle support requests efficiently. It allows users to submit tickets and administrators to manage, update, and resolve these tickets.

## Features

- User authentication and role-based access control
- Ticket creation, viewing, and management
- Comment system for communication between users and admins
- Status and priority management
- Notification system
- Responsive design for multiple devices

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3005
   DB_URL=mongodb://localhost:27017/helphub
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   SALTROUNDS=10
   ```
4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Authentication

- **POST /register** - Register a new user
  - Body: `{ username, epost, passord, confirmpassord }`
  
- **POST /login** - Login a user
  - Body: `{ epost, passord }`
  
- **GET /logout** - Logout a user

### Tickets

- **GET /tickets/all** - Get all tickets (admin sees all, users see their own)
- **GET /tickets/dashboard** - Admin dashboard with all tickets
- **GET /tickets/create** - Render ticket creation form
- **POST /tickets/create** - Create a new ticket
  - Body: `{ title, description, category, priority }`
  
- **GET /tickets/view/:id** - View a specific ticket
- **POST /tickets/edit** - Edit a ticket
  - Body: `{ ticketId, title, description, priority, status, adminComment }`
  
- **POST /tickets/comment** - Add a comment to a ticket
  - Body: `{ ticketId, comment }`
  
- **PUT /tickets/update-status** - Update ticket status (admin only)
  - Body: `{ ticketId, status }`

### Messages

- **GET /messages/unread** - Get unread notifications
- **PUT /messages/read/:id** - Mark a notification as read
- **PUT /messages/read-all** - Mark all notifications as read

## User Roles

### User
- Create tickets
- View and comment on their own tickets
- Receive notifications for ticket updates

### Admin
- Access dashboard with all tickets
- Update ticket status and priority
- Comment on any ticket
- View system statistics

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, EJS templates
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with HTTP-only cookies
- **Other**: Bcrypt for password hashing, Multer for form data parsing
