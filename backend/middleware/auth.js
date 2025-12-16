const jwt = require('jsonwebtoken');
const DatabaseService = require('../services/DatabaseService');

// Verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid token',
          message: 'Token is not valid'
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Authentication error',
      message: error.message
    });
  }
};

// Check user roles
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const users = await DatabaseService.find('users', {
        where: { id: req.user.id },
        select: ['role', 'is_premium', 'status']
      });

      if (users.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User account does not exist'
        });
      }

      const user = users[0];

      if (user.status !== 'active') {
        return res.status(403).json({
          error: 'Account suspended',
          message: 'Your account has been suspended'
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This action requires ${allowedRoles.join(' or ')} role`
        });
      }

      req.user.role = user.role;
      req.user.is_premium = user.is_premium;
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Authorization error',
        message: error.message
      });
    }
  };
};


// Combined middleware for different access levels
const auth = {
  verifyToken,
  requireRole,
  // Common role combinations
  requireMember: requireRole('Member', 'Admin'),
  requireAdmin: requireRole('Admin')
};

module.exports = auth;
