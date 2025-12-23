
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseResponseBody = async (response: Response): Promise<any> => {
  // Prefer JSON when available, but gracefully handle empty bodies and non-JSON responses.
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text.length ? text : null;
  } catch {
    return null;
  }
};

const extractErrorMessage = (status: number, body: any): string => {
  if (status === 401) {
    // Clear invalid token on authentication errors
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Reload page to reset auth state
    window.location.reload();
    return 'Session expired. Please log in again.';
  }

  if (body && typeof body === "object") {
    // Handle validation errors with details array
    if (body.details && Array.isArray(body.details) && body.details.length > 0) {
      const firstDetail = body.details[0];
      if (firstDetail.msg && typeof firstDetail.msg === "string") {
        return firstDetail.msg;
      }
    }

    // Fallback to error message
    if (typeof body.error === "string" && body.error.length) {
      return body.error;
    }

    // Fallback to message field
    if (typeof body.message === "string" && body.message.length) {
      return body.message;
    }
  }
  return `HTTP error! status: ${status}`;
};

// Create the real API client
const realApiClient = {
  async get(url: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    const body = await parseResponseBody(response);
    if (!response.ok) throw new Error(extractErrorMessage(response.status, body));
    return body;
  },

  async post(url: string, data: unknown): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const body = await parseResponseBody(response);
    if (!response.ok) throw new Error(extractErrorMessage(response.status, body));
    return body;
  },

  async put(url: string, data: unknown): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const body = await parseResponseBody(response);
    if (!response.ok) throw new Error(extractErrorMessage(response.status, body));
    return body;
  },

  async patch(url: string, data: unknown): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const body = await parseResponseBody(response);
    if (!response.ok) throw new Error(extractErrorMessage(response.status, body));
    return body;
  },

  async delete(url: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    });
    const body = await parseResponseBody(response);
    if (!response.ok) throw new Error(extractErrorMessage(response.status, body));
    return body;
  },

  // Auth endpoints that don't need authentication
  async authPost(url: string, data: unknown): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await parseResponseBody(response);
    if (!response.ok) throw new Error(extractErrorMessage(response.status, body));
    return body;
  },
};

// Export the API client directly
export const apiClient = realApiClient;