const jwt = require('jsonwebtoken');

function isAuthenticated(req, res, next) {
    const token = req.cookies.user; // Ensure the cookie name matches

    if (!token) {
        console.log("No token found");
        return res.redirect("/login");
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("JWT Error:", err);
            return res.redirect("/login");
        }
        console.log("Decoded Token:", decoded); // Debugging log
        req.user = decoded; // Set the decoded token as the user object
        next();
    });
}

function isAdmin(req, res, next) {
    console.log("User Role:", req.user ? req.user.role : "No user"); // Debugging log
    if (req.user && req.user.role === 'Admin') { // Ensure req.user exists and role is Admin
        return next();
    }
    return res.status(403).send('Access denied. Admins only.');
}

function setAuthStatus(req, res, next) {
    const token = req.cookies.user; // Ensure the cookie name matches
    res.locals.isAuthenticated = false;
    res.locals.isAdmin = false;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.locals.isAuthenticated = true;
            res.locals.isAdmin = decoded.role === 'Admin'; // Set isAdmin to true if the user's role is Admin
        } catch (err) {
            console.error("Token verification error in setAuthStatus:", err);
        }
    }
    next();
}

module.exports = { isAuthenticated, isAdmin, setAuthStatus };