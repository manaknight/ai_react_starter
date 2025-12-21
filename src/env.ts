// Environment configuration
// Note: USE_MOCK now uses build-time constant for complete mock elimination
export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  USE_MOCK: __USE_MOCK__, // Build-time constant - completely tree-shaken in production
  NODE_ENV: import.meta.env.MODE,
} as const;

// Declare build-time constant
declare const __USE_MOCK__: boolean;
