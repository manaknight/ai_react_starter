const { z } = require('zod');

// User schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['Member', 'Admin', 'SuperAdmin']),
  is_premium: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional()
});

const UserProfileSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional()
});

const UserWithProfileSchema = UserSchema.extend({
  profile: UserProfileSchema.optional()
});

// Request schemas
const RegisterSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    company: z.string().optional(),
    title: z.string().optional()
  })
});

const LoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

const ForgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const ResetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(64).max(64),
    email: z.string().email(),
    password: z.string().min(6)
  })
});

// Response schemas
const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string()
});

const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['Member', 'Admin', 'SuperAdmin']),
  is_premium: z.boolean(),
  status: z.string(),
  created_at: z.string().datetime(),
  profile: UserProfileSchema.optional()
});

const CapabilitiesResponseSchema = z.record(z.string(), z.array(z.string()));

module.exports = {
  UserSchema,
  UserProfileSchema,
  UserWithProfileSchema,
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  AuthResponseSchema,
  UserResponseSchema,
  CapabilitiesResponseSchema
};
