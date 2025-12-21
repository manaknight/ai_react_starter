// Centralized API endpoints - single source of truth for all API routes
export const endpoints = {
  users: {
    list: "/api/users",
    get: (id: string) => `/api/users/${id}`,
    create: "/api/users",
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
  },
  // Auth endpoints
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    me: "/api/auth/me",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
    capabilities: "/auth/capabilities",
  },
  // Sponsors
  sponsors: {
    list: "/api/sponsors",
    apply: "/api/sponsors/apply",
    update: (id: string) => `/api/sponsors/${id}`,
    delete: (ids: string[]) => ids.map(id => `/api/sponsors/${id}`),
  },
  packages: {
    list: "/api/packages",
  },
  analytics: {
    dashboard: "/api/analytics",
  },
} as const;
