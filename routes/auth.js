const express = require('express');
const router = express.Router();

router.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        return res.status(200).json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

module.exports = router;
