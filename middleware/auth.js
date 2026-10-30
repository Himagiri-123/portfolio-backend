const jwt = require('jsonwebtoken');

const TOKEN_LIFETIME = '1h';

// JWT_SECRET should be set in the hosting dashboard. If it is missing, a secret is
// derived from the admin credentials so the site keeps working (set JWT_SECRET anyway).
function getSecret() {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    return `${process.env.ADMIN_USER}:${process.env.ADMIN_PASS}:fallback-secret`;
}

function signToken() {
    return jwt.sign({ role: 'admin' }, getSecret(), { expiresIn: TOKEN_LIFETIME });
}

// Protects write routes: requires "Authorization: Bearer <token>"
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Login required' });

    try {
        jwt.verify(token, getSecret());
        next();
    } catch (err) {
        res.status(401).json({ message: 'Session expired or invalid. Please sign in again.' });
    }
}

module.exports = { signToken, requireAuth };
