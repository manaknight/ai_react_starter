// Conditional Database Imports
let DatabaseService;
if (process.env.MOCK_MODE !== 'true') {
  DatabaseService = require('../services/DatabaseService');
}
const MockDataService = require('../services/MockDataService');

// Import schemas
const {
  UserSchema,
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  AuthResponseSchema,
  UserResponseSchema,
  CapabilitiesResponseSchema
} = require('./schemas/auth');

// Import services
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const { getAllCapabilities } = require('../core/Capability');

// Helper functions
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

module.exports = [
  // POST /api/auth/register
  {
    path: '/register',
    method: 'POST',
    capability: null, // Public endpoint
    schema: AuthResponseSchema,
    requestSchema: RegisterSchema,
    mock: async (req) => {
      const { email, password, name, company, title } = req.body;

      // Check if user exists
      const existingUsers = MockDataService.findAll('users');
      if (existingUsers.some(u => u.email === email)) {
        throw new Error('User already exists');
      }

      // Create user
      const user = MockDataService.persist('users', {
        id: crypto.randomUUID(),
        email,
        password_hash: await bcrypt.hash(password, 12),
        role: 'Member',
        is_premium: false,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Create profile
      const profile = MockDataService.persist('user_profiles', {
        user_id: user.id,
        name,
        company: company || null,
        title: title || null
      });

      const token = generateToken(user);
      return { user, token };
    },
    real: async (req, db) => {
      const { email, password, name, company, title } = req.body;

      // Check if user already exists
      const existingUsers = await db.find('users', {
        where: { email },
        select: ['id']
      });

      if (existingUsers.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user and profile in transaction
      const result = await DatabaseService.transaction(async () => {
        // Create user
        const userResult = await db.insert('users', {
          email,
          password_hash: passwordHash,
          role: 'Member',
          is_premium: false
        });

        const userId = userResult.id;

        // Create user profile
        await db.insert('user_profiles', {
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

      return {
        user: {
          id: userId,
          email,
          role: 'Member',
          is_premium: false
        },
        token
      };
    },
    noAuth: true,
    forceMock: false,
    delay: 0
  },

  // POST /api/auth/login
  {
    path: '/login',
    method: 'POST',
    capability: null, // Public endpoint
    schema: AuthResponseSchema,
    requestSchema: LoginSchema,
    mock: async (req) => {
      const { email, password } = req.body;

      const users = MockDataService.findAll('users');
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      if (user.status !== 'active') {
        throw new Error('Account suspended');
      }

      const token = generateToken(user);
      return { user, token };
    },
    real: async (req, db) => {
      const { email, password } = req.body;

      // Find user with profile
      const users = await DatabaseService.query(
        'SELECT u.id, u.email, u.password_hash, u.role, u.is_premium, u.status, p.name FROM manda_users u LEFT JOIN manda_user_profiles p ON u.id = p.user_id WHERE u.email = ?',
        [email]
      );

      if (users.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = users[0];

      if (user.status !== 'active') {
        throw new Error('Account suspended');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = generateToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          is_premium: user.is_premium,
          name: user.name
        },
        token
      };
    },
    noAuth: true,
    forceMock: false,
    delay: 0
  },

  // GET /api/auth/me
  {
    path: '/me',
    method: 'GET',
    capability: 'profile:read',
    schema: UserResponseSchema,
    mock: (req) => {
      const user = MockDataService.findById('users', req.user.id);
      if (!user) {
        throw new Error('User not found');
      }

      const profile = MockDataService.findAll('user_profiles')
        .find(p => p.user_id === user.id);

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        is_premium: user.is_premium,
        status: user.status,
        created_at: user.createdAt,
        profile
      };
    },
    real: async (req, db) => {
      const users = await DatabaseService.query(
        'SELECT u.id, u.email, u.role, u.is_premium, u.status, u.created_at, p.name, p.company, p.title, p.bio FROM manda_users u LEFT JOIN manda_user_profiles p ON u.id = p.user_id WHERE u.id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];

      return {
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
      };
    },
    noAuth: false,
    forceMock: false,
    delay: 0
  },

  // GET /api/auth/capabilities
  {
    path: '/capabilities',
    method: 'GET',
    capability: null, // Public endpoint
    schema: CapabilitiesResponseSchema,
    mock: () => {
      return getAllCapabilities();
    },
    real: () => {
      return getAllCapabilities();
    },
    noAuth: true,
    forceMock: false,
    delay: 0
  },

  // POST /api/auth/forgot-password
  {
    path: '/forgot-password',
    method: 'POST',
    capability: null, // Public endpoint
    schema: z.object({ message: z.string() }),
    requestSchema: ForgotPasswordSchema,
    mock: (req) => {
      const { email } = req.body;
      const users = MockDataService.findAll('users');
      const user = users.find(u => u.email === email);

      if (!user) {
        return { message: 'If an account with this email exists, a password reset link has been sent.' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Store token
      MockDataService.persist('password_reset_tokens', {
        id: crypto.randomUUID(),
        user_id: user.id,
        token: hashedToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        used: false
      });

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      console.log('Password reset requested for:', email);
      console.log('Reset URL (send via email):', resetUrl);

      return { message: 'If an account with this email exists, a password reset link has been sent.', resetUrl };
    },
    real: async (req, db) => {
      const { email } = req.body;

      // Find user by email
      const users = await db.find('users', {
        where: { email },
        select: ['id', 'email', 'role', 'status']
      });

      if (users.length === 0) {
        // Don't reveal if email exists or not for security
        return { message: 'If an account with this email exists, a password reset link has been sent.' };
      }

      const user = users[0];

      if (user.status !== 'active') {
        throw new Error('Account inactive');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Save token to database
      await db.insert('password_reset_tokens', {
        user_id: user.id,
        token: hashedToken,
        expires_at: expiresAt
      });

      // TODO: Send email with reset link
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      console.log('Password reset requested for:', email);
      console.log('Reset URL (send via email):', resetUrl);

      return { message: 'If an account with this email exists, a password reset link has been sent.', resetUrl };
    },
    noAuth: true,
    forceMock: false,
    delay: 0
  },

  // POST /api/auth/reset-password
  {
    path: '/reset-password',
    method: 'POST',
    capability: null, // Public endpoint
    schema: z.object({ message: z.string() }),
    requestSchema: ResetPasswordSchema,
    mock: async (req) => {
      const { token, email, password } = req.body;

      // Hash the provided token
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const tokens = MockDataService.findAll('password_reset_tokens')
        .filter(t => t.token === hashedToken && !t.used && new Date(t.expires_at) > new Date());

      if (tokens.length === 0) {
        throw new Error('Invalid or expired token');
      }

      const resetToken = tokens[0];

      // Verify email matches
      const user = MockDataService.findById('users', resetToken.user_id);
      if (user.email !== email) {
        throw new Error('Email mismatch');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update user password
      MockDataService.persist('users', {
        ...user,
        password_hash: passwordHash,
        updatedAt: new Date().toISOString()
      });

      // Mark token as used
      MockDataService.persist('password_reset_tokens', {
        ...resetToken,
        used: true
      });

      return { message: 'Password has been reset successfully' };
    },
    real: async (req, db) => {
      const { token, email, password } = req.body;

      // Hash the provided token
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const tokens = await DatabaseService.query(
        'SELECT t.*, u.email, u.status FROM manda_password_reset_tokens t JOIN manda_users u ON t.user_id = u.id WHERE t.token = ? AND t.used = FALSE AND t.expires_at > NOW()',
        [hashedToken]
      );

      if (tokens.length === 0) {
        throw new Error('Invalid or expired token');
      }

      const resetToken = tokens[0];

      // Verify email matches
      if (resetToken.email !== email) {
        throw new Error('Email mismatch');
      }

      if (resetToken.status !== 'active') {
        throw new Error('Account inactive');
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update password and mark token as used in transaction
      await DatabaseService.transaction(async () => {
        // Update user password
        await db.update('users', {
          password_hash: passwordHash
        }, {
          where: { id: resetToken.user_id }
        });

        // Mark token as used
        await db.update('password_reset_tokens', {
          used: true
        }, {
          where: { id: resetToken.id }
        });
      });

      return { message: 'Password has been reset successfully' };
    },
    noAuth: true,
    forceMock: false,
    delay: 0
  }
];
