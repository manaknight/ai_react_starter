// Centralized mock database - single source of truth for all mock data
export const mockDb = {
  users: [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'admin' as const,
      is_premium: true,
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'member' as const,
      is_premium: false,
    },
    {
      id: '3',
      name: 'Carol Williams',
      email: 'carol@example.com',
      role: 'member' as const,
      is_premium: false,
    },
  ],
  packages: [
    {
      id: '1',
      name: 'react',
      version: '18.2.0',
      description: 'A JavaScript library for building user interfaces',
    },
    {
      id: '2',
      name: 'typescript',
      version: '5.0.0',
      description: 'TypeScript is a superset of JavaScript',
    },
  ],
  sponsors: [],
  analytics: {
    totalUsers: 42,
    activeUsers: 23,
    premiumUsers: 5,
  }
};
