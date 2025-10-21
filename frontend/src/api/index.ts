export * from './auth';
export * from './user';
export * from './board';

class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

export async function sendPostRequest<T>(url: string, body: object, authToken?: string): Promise<T> {
  try {
    const headers: Record<string, string> = {};

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Try to parse a JSON error body; fall back to status text when unavailable
      let message = response.statusText || 'Request failed';
      let status = response.status;
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object') {
          // FastAPI returns errors in 'detail' field
          message = (errorData.detail as string) || (errorData.message as string) || message;
          status = (errorData.status as number) || status;
        }
      } catch (e) {
        // Non-JSON response body (e.g., empty). Keep defaults.
      }
      throw new APIError(message, status);
    }

    // Normal JSON response
    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function sendGetRequest<T>(url: string, authToken?: string): Promise<T> {
  try {
    const headers: Record<string, string> = {};

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      // Parse JSON error body when possible, otherwise use status text
      let message = response.statusText || 'Request failed';
      let status = response.status;
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object') {
          // FastAPI returns errors in 'detail' field
          message = (errorData.detail as string) || (errorData.message as string) || message;
          status = (errorData.status as number) || status;
        }
      } catch (e) {
        // ignore parse errors
      }
      throw new APIError(message, status);
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
