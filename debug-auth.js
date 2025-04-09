const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create a simple server for debugging
const app = express();
app.use(cookieParser());

// Debug endpoint to check cookies
app.get('/debug/cookies', (req, res) => {
  console.log('All cookies:', req.cookies);
  res.json({
    cookies: req.cookies,
    userCookie: req.cookies.user || 'Not found'
  });
});

// Debug endpoint to verify JWT
app.get('/debug/token', (req, res) => {
  const token = req.cookies.user;
  
  if (!token) {
    return res.json({ error: 'No token found' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      valid: true,
      decoded: decoded,
      expires: new Date(decoded.exp * 1000).toLocaleString()
    });
  } catch (err) {
    res.json({
      valid: false,
      error: err.message
    });
  }
});

// Simple form to test login
app.get('/debug/login-form', (req, res) => {
  res.send(`
    <html>
      <head><title>Debug Login</title></head>
      <body>
        <h1>Debug Login Form</h1>
        <form action="/login" method="post">
          <div>
            <label>Email: <input name="epost" type="text"></label>
          </div>
          <div>
            <label>Password: <input name="passord" type="password"></label>
          </div>
          <button type="submit">Login</button>
        </form>
      </body>
    </html>
  `);
});

const PORT = 3006;
app.listen(PORT, () => {
  console.log(`Debug server running at http://localhost:${PORT}`);
  console.log(`- Check cookies: http://localhost:${PORT}/debug/cookies`);
  console.log(`- Verify token: http://localhost:${PORT}/debug/token`);
  console.log(`- Test login: http://localhost:${PORT}/debug/login-form`);
});
