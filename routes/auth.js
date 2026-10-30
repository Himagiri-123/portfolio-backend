const express = require('express');
const { signToken } = require('../middleware/auth');

const router = express.Router();

// Simple in-memory brute-force protection: 10 failed attempts per IP per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED = 10;
const failedAttempts = new Map();

function isBlocked(ip) {
    const entry = failedAttempts.get(ip);
    if (!entry) return false;
    if (Date.now() - entry.first > WINDOW_MS) {
        failedAttempts.delete(ip);
        return false;
    }
    return entry.count >= MAX_FAILED;
}

function recordFailure(ip) {
    const entry = failedAttempts.get(ip);
    if (!entry || Date.now() - entry.first > WINDOW_MS) failedAttempts.set(ip, { count: 1, first: Date.now() });
    else entry.count++;
}

router.post('/api/login', (req, res) => {
    const ip = req.ip;
    if (isBlocked(ip)) {
        return res.status(429).json({ message: 'Too many failed attempts. Please try again in 15 minutes.' });
    }

    const { username, password } = req.body;
    if (username && password && username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        failedAttempts.delete(ip);
        return res.json({ success: true, token: signToken() });
    }

    recordFailure(ip);
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

module.exports = router;
