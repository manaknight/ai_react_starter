// Environment configuration
export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  NODE_ENV: import.meta.env.MODE,
} as const;
