const jwt = require('jsonwebtoken');

function isAuthenticated(req, res, next) {
    const token = req.cookies.user;

    if (!token) {
        console.log("Authentication failed: No token found in cookies");
        return res.redirect("/login");
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Authentication successful for user:", decoded.userId);
        req.user = decoded;
        next();
    } catch (err) {
        console.log("Authentication failed: Invalid token -", err.message);
        res.clearCookie('user'); // Clear the invalid token
        return res.redirect("/login");
    }
}

function isAdmin(req, res, next) {
    if (!req.user) {
        console.log("Admin check failed: No user in request");
        return res.status(403).send('Access denied. Not authenticated.');
    }
    
    if (req.user.role !== 'Admin') {
        console.log("Admin check failed: User is not an admin -", req.user.role);
        return res.status(403).send('Access denied. Admins only.');
    }
    
    console.log("Admin check passed for user:", req.user.userId);
    return next();
}

function setAuthStatus(req, res, next) {
    const token = req.cookies.user;
    res.locals.isAuthenticated = false;
    res.locals.isAdmin = false;
    res.locals.username = null;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.locals.isAuthenticated = true;
            res.locals.isAdmin = decoded.role === 'Admin';
            res.locals.username = decoded.username || null;
            console.log("Auth status set: authenticated=true, admin=", res.locals.isAdmin);
        } catch (err) {
            console.error("Token verification error in setAuthStatus:", err.message);
            res.clearCookie('user'); // Clear the invalid token
        }
    } else {
        console.log("Auth status set: No token found");
    }
    next();
}

module.exports = { isAuthenticated, isAdmin, setAuthStatus };