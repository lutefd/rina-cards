import { createAuthClient } from 'better-auth/react';

/**
 * Client-side authentication client for Better Auth
 * 
 * This client provides methods for:
 * - Email/password authentication
 * - Google OAuth authentication
 * - Session management
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
});

/**
 * Custom authentication methods for direct API calls
 * These are used when Better Auth's built-in methods don't provide enough flexibility
 */
export const customAuth = {
  /**
   * Register a new user with email, password, and additional data
   */
  async signUp({ name, email, password, userType = 'customer' }: { 
    name: string; 
    email: string; 
    password: string; 
    userType?: string;
  }) {
    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, userType }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : null,
        error: !response.ok ? data.message : null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Update the user's profile
   */
  async updateProfile(profile: { name?: string; userType?: string }) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : null,
        error: !response.ok ? data.message : null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },
};
