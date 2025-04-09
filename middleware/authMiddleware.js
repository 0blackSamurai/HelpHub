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

function isSupportStaff(req, res, next) {
    console.log("User Role:", req.user ? req.user.role : "No user");
    if (req.user && (req.user.role === '1st Line' || req.user.role === '2nd Line')) {
        return next();
    }
    return res.status(403).send('Access denied. Support staff only.');
}

function setAuthStatus(req, res, next) {
    const token = req.cookies.user; // Ensure the cookie name matches
    res.locals.isAuthenticated = false;
    res.locals.isAdmin = false;
    res.locals.isSupportStaff = false;
    res.locals.userRole = null;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.locals.isAuthenticated = true;
            res.locals.isAdmin = decoded.role === 'Admin';
            res.locals.isSupportStaff = decoded.role === '1st Line' || decoded.role === '2nd Line';
            res.locals.userRole = decoded.role;
        } catch (err) {
            console.error("Token verification error in setAuthStatus:", err);
        }
    }
    next();
}

module.exports = { isAuthenticated, isAdmin, isSupportStaff, setAuthStatus };