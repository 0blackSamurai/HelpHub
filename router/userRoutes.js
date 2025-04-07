const express = require('express');
const router = express.Router();

// Render the index page
router.get('/', (req, res) => {
    res.render('index', { title: 'Welcome' });
});

module.exports = router;
