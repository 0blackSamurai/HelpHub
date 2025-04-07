const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, epost, passord, confirmpassord, role } = req.body;

    if (passord !== confirmpassord) {
        return res.send('Passwords do not match');
    }

    try {
        const hashedPassword = await bcrypt.hash(passord, parseInt(process.env.SALTROUNDS));

        const newUser = new User({
            username, // Save username
            epost, // Save email
            passord: hashedPassword,
            role
        });

        await newUser.save();
        res.send('Registration successful');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
};

exports.login = async (req, res) => {
    const { epost, passord } = req.body;
    
    const user = await User.findOne({ epost });

    if (!user) {
        return res.status(400).send('Bruker ikke funnet');
    }

    const isMatch = await bcrypt.compare(passord, user.passord);

    if (!isMatch) {
        return res.status(400).send('Feil passord');
    }

    const token = jwt.sign(
        { userId: user._id, role: user.role }, // Include role in the token
        process.env.JWT_SECRET,
        { expiresIn: '48h' }
    );
    res.cookie('user', token, { httpOnly: true }); // Ensure the cookie name matches
    return res.status(200).redirect("/profile");
};

exports.logout = (req, res) => {
    try {
      res.clearCookie('user');
      res.redirect("/login");
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).send({ msg: "An error occurred during logout" });
    }
};

exports.renderRegisterPage = (req, res) => {
    res.render("register", { title: "register"  });
};

exports.renderLoginPage = (req, res) => {
    res.render("login", { title: "login" });
};

exports.renderDashboardPage = (req, res) => {
    res.render("dashboard", { title: "profile" });
};

exports.renderProfilePage = (req, res) => {
    res.render("profile", { title: "Profile" });
};
