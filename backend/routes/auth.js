const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/DatabaseService');
const auth = require('../middleware/auth');
const { getAllCapabilities } = require('../core/Capability');

const router = express.Router();

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 }),
  body('company').optional().trim(),
  body('title').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, company, title } = req.body;

    // Check if user already exists
    const existingUsers = await DatabaseService.find('users', {
      where: { email },
      select: ['id']
    });

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user and profile in transaction
    const result = await DatabaseService.transaction(async () => {
      // Create user
      const userResult = await DatabaseService.insert('users', {
        email,
        password_hash: passwordHash,
        role: 'Member',
        is_premium: false
      });

      const userId = userResult.id;

      // Create user profile
      await DatabaseService.insert('user_profiles', {
        user_id: userId,
        name,
        company: company || null,
        title: title || null
      });

      return userId;
    });

    const userId = result;

    // Generate token
    const token = generateToken({
      id: userId,
      email,
      role: 'Member'
    });

    res.status(201).json({
      user: {
        id: userId,
        email,
        role: 'Member',
        is_premium: false
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const users = await DatabaseService.query(
      'SELECT u.id, u.email, u.password_hash, u.role, u.is_premium, u.status, p.name FROM manda_users u LEFT JOIN manda_user_profiles p ON u.id = p.user_id WHERE u.email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_premium: user.is_premium,
        name: user.name
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// GET /api/auth/me
router.get('/me', auth.verifyToken, async (req, res) => {
  try {
    const users = await DatabaseService.query(
      'SELECT u.id, u.email, u.role, u.is_premium, u.status, u.created_at, p.name, p.company, p.title, p.bio FROM manda_users u LEFT JOIN manda_user_profiles p ON u.id = p.user_id WHERE u.id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account does not exist'
      });
    }

    const user = users[0];

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      is_premium: user.is_premium,
      status: user.status,
      created_at: user.created_at,
      profile: {
        name: user.name,
        company: user.company,
        title: user.title,
        bio: user.bio
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user data',
      message: error.message
    });
  }
});

// GET /api/auth/capabilities - Public endpoint to get role capabilities
router.get('/capabilities', (req, res) => {
  try {
    const capabilities = getAllCapabilities();
    res.json(capabilities);
  } catch (error) {
    console.error('Get capabilities error:', error);
    res.status(500).json({
      error: 'Failed to get capabilities',
      message: error.message
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const users = await DatabaseService.find('users', {
      where: { email },
      select: ['id', 'email', 'role', 'status']
    });

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account is not active'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save token to database
    await DatabaseService.insert('password_reset_tokens', {
      user_id: user.id,
      token: hashedToken,
      expires_at: expiresAt
    });

    // TODO: Send email with reset link
    // For now, just return the token (in production, send via email)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log('Password reset requested for:', email);
    console.log('Reset URL (send via email):', resetUrl);

    res.json({
      message: 'If an account with this email exists, a password reset link has been sent.',
      resetUrl // Remove this in production
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: error.message
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').isLength({ min: 64, max: 64 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token, email, password } = req.body;

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const tokens = await DatabaseService.query(
      'SELECT t.*, u.email, u.status FROM manda_password_reset_tokens t JOIN manda_users u ON t.user_id = u.id WHERE t.token = ? AND t.used = FALSE AND t.expires_at > NOW()',
      [hashedToken]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'The reset token is invalid or has expired'
      });
    }

    const resetToken = tokens[0];

    // Verify email matches
    if (resetToken.email !== email) {
      return res.status(400).json({
        error: 'Email mismatch',
        message: 'The email does not match the reset token'
      });
    }

    if (resetToken.status !== 'active') {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account is not active'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and mark token as used in transaction
    await DatabaseService.transaction(async () => {
      // Update user password
      await DatabaseService.update('users', {
        password_hash: passwordHash
      }, {
        where: { id: resetToken.user_id }
      });

      // Mark token as used
      await DatabaseService.update('password_reset_tokens', {
        used: true
      }, {
        where: { id: resetToken.id }
      });
    });

    res.json({
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: error.message
    });
  }
});

module.exports = router;
