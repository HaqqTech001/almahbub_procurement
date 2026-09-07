const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { getJwtSecret } = require('../config/security');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    
    // Get user from database
    const [users] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, email_verified FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireVerified = (req, res, next) => {
  if (!req.user.email_verified) {
    return res.status(403).json({ error: 'Email verification required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireVerified
};