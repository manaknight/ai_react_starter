// Centralized mock handling - all mock logic in one place
import { mockDb } from '@/services/mock/mockDb';

// Handler function type
type HandlerFunction = (url: string, method: string, data?: any) => Promise<any>;

// Centralized mock handlers - route all API requests through here
export const handlerAdapters: Record<string, HandlerFunction> = {
  // Users endpoints
  "/api/users": async (url, method, data) => {
    if (method === 'GET') {
      return mockDb.users;
    }
    if (method === 'POST') {
      const newUser = {
        id: String(Date.now()),
        ...data,
        role: data.role || 'member',
        is_premium: data.is_premium || false
      };
      mockDb.users.push(newUser);
      return newUser;
    }
  },

  // Individual user endpoints
  "/api/users/:id": async (url, method, data) => {
    const id = url.split('/').pop();
    const userIndex = mockDb.users.findIndex(u => u.id === id);

    if (method === 'GET') {
      if (userIndex === -1) throw new Error('User not found');
      return mockDb.users[userIndex];
    }

    if (method === 'PUT') {
      if (userIndex === -1) throw new Error('User not found');
      mockDb.users[userIndex] = { ...mockDb.users[userIndex], ...data };
      return mockDb.users[userIndex];
    }

    if (method === 'DELETE') {
      if (userIndex === -1) throw new Error('User not found');
      const deletedUser = mockDb.users[userIndex];
      mockDb.users.splice(userIndex, 1);
      return { message: 'User deleted successfully' };
    }
  },

  // Auth endpoints
  "/api/auth/login": async (url, method, data) => {
    if (method !== 'POST') throw new Error('Method not allowed');
    const { email, password } = data as { email: string; password: string };
    const user = mockDb.users.find(u => u.email === email);
    if (!user || password !== 'password123') {
      throw new Error('Invalid credentials');
    }
    return {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJkZXJla3dvbmdAZ21haWwuY29tIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc2NjI5ODEwMCwiZXhwIjoxNzY2MzA1MzAwLCJpc3MiOiJ2Y2UtYXBpIiwic3ViIjoiMiJ9.nF08UX1mNAbRj960xm_3nFYaxiU-aemXNYV6t4w3c9k',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_premium: user.is_premium
      }
    };
  },

  // Packages endpoints
  "/api/packages": async (url, method, data) => {
    if (method === 'GET') {
      return mockDb.packages;
    }
  },

  // Analytics endpoints
  "/api/analytics": async (url, method, data) => {
    if (method === 'GET') {
      return mockDb.analytics;
    }
  },

  // Default handler for unimplemented endpoints
  "default": async (url, method) => {
    console.warn(`Mock handler not implemented for ${method} ${url}`);
    return { message: `Mock response for ${method} ${url}` };
  }
};

// Function to get handler for a URL - supports dynamic routes
export function getHandlerForUrl(url: string, method: string): HandlerFunction {
  // Check for exact matches first
  if (handlerAdapters[url]) {
    return handlerAdapters[url];
  }

  // Check for pattern matches (dynamic routes like /api/users/:id)
  for (const [pattern, handler] of Object.entries(handlerAdapters)) {
    if (pattern.includes(':id')) {
      const patternRegex = new RegExp('^' + pattern.replace(':id', '([^/]+)') + '$');
      if (patternRegex.test(url)) {
        return handler;
      }
    }
  }

  // Return default handler
  return handlerAdapters.default;
}
