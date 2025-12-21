import { getHandlerForUrl } from '@/services/mock/handlerAdapter';

// Mock implementation of API client for testing
// Routes requests through handler adapters instead of making HTTP calls

const extractErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error occurred";
};

export const mockApiClient = {
  async get(url: string): Promise<any> {
    try {
      const handler = getHandlerForUrl(url, 'GET');
      return await handler(url, 'GET');
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async post(url: string, data: unknown): Promise<any> {
    try {
      const handler = getHandlerForUrl(url, 'POST');
      return await handler(url, 'POST', data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async put(url: string, data: unknown): Promise<any> {
    try {
      const handler = getHandlerForUrl(url, 'PUT');
      return await handler(url, 'PUT', data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async patch(url: string, data: unknown): Promise<any> {
    try {
      const handler = getHandlerForUrl(url, 'PATCH');
      return await handler(url, 'PATCH', data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async delete(url: string): Promise<any> {
    try {
      const handler = getHandlerForUrl(url, 'DELETE');
      return await handler(url, 'DELETE');
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Auth endpoints that don't need authentication (same as regular post for mock)
  async authPost(url: string, data: unknown): Promise<any> {
    try {
      const handler = getHandlerForUrl(url, 'POST');
      return await handler(url, 'POST', data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};