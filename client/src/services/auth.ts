/**
 * Centralized Authentication Service for Smart Gym
 */

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email?: string;
  user?: AuthUser;
  message?: string;
}

const TOKEN_KEY = 'gym_token';
const USER_KEY = 'gym_user';
const EMAIL_KEY = 'gym_email';
const REMEMBER_KEY = 'gym_remember';

/**
 * Resolves the appropriate API base URL dynamically.
 * Prioritizes relative paths so that Vite proxy (localhost:5173 -> 3000),
 * Express (same origin), and Vercel serverless (/api/(.*)) all work seamlessly.
 */
function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  
  if (!envUrl) {
    return '';
  }

  // Safety check: if VITE_API_URL is configured to localhost but the site is being accessed
  // from a remote domain or device (e.g. Vercel deployment), fall back to relative paths
  if (typeof window !== 'undefined' && window.location) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return '';
    }
  }

  return envUrl;
}

/**
 * Safely executes API requests, ensuring JSON errors and non-JSON server responses
 * are cleanly handled without crashing on JSON parsing.
 */
async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (netErr: any) {
    // If an absolute URL was attempted and failed, try falling back to relative path
    if (apiBase) {
      try {
        response = await fetch(endpoint, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      } catch {
        console.error('Network request failed:', netErr);
        throw new Error('Unable to connect to the Smart Gym server. Please verify your connection.');
      }
    } else {
      console.error('Network request failed:', netErr);
      throw new Error('Unable to connect to the Smart Gym server. Please verify your connection.');
    }
  }

  const rawText = await response.text();
  let data: any = {};
  
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      // In case server returned HTML (e.g. 502/504 or proxy error)
      if (!response.ok) {
        throw new Error(`Server returned error status (${response.status})`);
      }
      throw new Error('Unexpected server response format');
    }
  }

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const authService = {
  /**
   * Log in user with email and password
   */
  async login(identifier: string, password: string, rememberMe = true): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: identifier, password }),
    });

    if (data.token) {
      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, data.username);
        if (data.email) localStorage.setItem(EMAIL_KEY, data.email);
        localStorage.setItem(REMEMBER_KEY, 'true');
      } else {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.setItem(USER_KEY, data.username);
        if (data.email) sessionStorage.setItem(EMAIL_KEY, data.email);
        localStorage.removeItem(REMEMBER_KEY);
      }
    }

    return data;
  },

  /**
   * Register a new user
   */
  async register(fullName: string, email: string, password: string): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, data.username);
      if (data.email) localStorage.setItem(EMAIL_KEY, data.email);
    }

    return data;
  },

  /**
   * Request password reset instructions
   */
  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    return await apiRequest('/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Reset password with new password
   */
  async resetPassword(email: string, password: string, resetToken?: string): Promise<{ message: string }> {
    return await apiRequest('/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, password, resetToken }),
    });
  },

  /**
   * Clear all auth sessions
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EMAIL_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
  },

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get current username
   */
  getUsername(): string {
    return localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY) || '';
  },

  /**
   * Get current email
   */
  getEmail(): string {
    return localStorage.getItem(EMAIL_KEY) || sessionStorage.getItem(EMAIL_KEY) || '';
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

