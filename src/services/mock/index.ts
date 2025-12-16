// Mock data and utilities
export const mockDelay = (ms: number = 500) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const mockUsers = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin' as const,
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'member' as const,
  },
  {
    id: '3',
    name: 'Carol Williams',
    email: 'carol@example.com',
    role: 'member' as const,
  },
];

export const mockPackages = [
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
];
