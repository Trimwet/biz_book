import { createContext, useEffect, useState } from 'react';
import config from '../config';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AppUser {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  user_type: 'vendor' | 'shopper' | 'admin';
  can_sell?: boolean;
  created_at?: string;
  vendor_profile?: Record<string, any>;
  shopper_profile?: Record<string, any>;
  phone?: string | null;
  avatar?: string | null;
}

interface UserContextValue {
  user: AppUser | null;
  loading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: Record<string, any>, userType: string) => Promise<any>;
  logout: () => Promise<void>;
  logoutWithConfirmation: () => void;
  getProfile: () => Promise<any>;
  updateProfile: (profileData: Record<string, any>) => Promise<any>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<any>;
  apiRequest: (endpoint: string, options?: RequestInit & { body?: any }) => Promise<any>;
  isAuthenticated: () => boolean;
  isVendor: () => boolean;
  isShopper: () => boolean;
  canSell: () => boolean;
  refreshAccessToken: () => Promise<string>;
}

const UserContext = createContext<UserContextValue>({} as UserContextValue);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(() => {
    // Get refresh token from localStorage on initial load
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  });

  // Access token state with auto-refresh functionality
  const [accessToken, setAccessToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  });

  // Function to refresh access token
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();
      
      // Update tokens in state and localStorage
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  // Function to make authenticated API requests
  const apiRequest = async (endpoint: string, options: RequestInit & { body?: any } = {}) => {
    let token = accessToken;
    
    // If no token, try to get it from localStorage
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken');
    }

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    // Build headers — avoid Content-Type for FormData (browser sets boundary automatically)
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };

    const url = `${config.API_BASE_URL}${endpoint}`;
    
    try {
      let response = await fetch(url, { ...options, headers });
      
      // If token is expired (401), try to refresh it
      if (response.status === 401) {
        try {
          const newToken = await refreshAccessToken();
          // Retry the request with the new token
          headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(url, { ...options, headers });
        } catch (refreshError) {
          // If refresh fails, throw the original error
          throw refreshError;
        }
      }

      if (!response.ok) {
        // Try json first, fall back to text for better error messages
        let errorPayload = null;
        try {
          errorPayload = await response.json();
        } catch (_) {
          try {
            const text = await response.text();
            errorPayload = { error: text };
          } catch (_) {
            errorPayload = {};
          }
        }
        throw new Error(errorPayload.error || `HTTP error! status: ${response.status}`);
      }

      // Parse success payload: try json, fall back to text
      try {
        return await response.json();
      } catch (_) {
        return await response.text();
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens in state and localStorage
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Register function
  const register = async (userData: Record<string, any>, userType: string) => {
    try {
      const endpoint = userType === 'vendor' ? '/api/auth/signup/vendor' : '/api/auth/signup/shopper';
      const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      
      // Store tokens in state and localStorage
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint to invalidate refresh token on server
      if (accessToken) {
        await fetch(`${config.API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }).catch(error => console.error('Logout API call failed:', error));
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Redirect to home page
      window.location.href = '/';
    }
  };

  // Logout with confirmation dialog
  const logoutWithConfirmation = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Get current user profile
  const getProfile = async () => {
    try {
      const data = await apiRequest('/api/auth/me');
      setUser(data);
      return data;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (profileData: Record<string, any>) => {
    try {
      const data = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      // Password change was successful, logout user
      await logout();
      return { message: 'Password changed successfully. Please login again.' };
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!accessToken || !!user;
  };

  // Check user type
  const isVendor = () => {
    return user?.user_type === 'vendor';
  };

  const isShopper = () => {
    return user?.user_type === 'shopper';
  };

  // Can this user list and sell products? (vendor accounts + shoppers who upgraded)
  const canSell = () => {
    return user?.user_type === 'vendor' || user?.can_sell === true;
  };

  // Initialize user state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have tokens in localStorage
        const storedToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        
        if (storedToken && storedRefreshToken) {
          setAccessToken(storedToken);
          setRefreshToken(storedRefreshToken);
          
          // Try to get user profile; on 401 attempt refresh once
          try {
            await getProfile();
          } catch (e) {
            try {
              const newToken = await refreshAccessToken();
              if (newToken) {
                await getProfile();
              }
            } catch (e2) {
              // Do not nuke tokens on transient issues; leave state as-is
              console.warn('Profile init failed after refresh:', e2);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    user,
    loading,
    accessToken,
    refreshToken,
    login,
    register,
    logout,
    logoutWithConfirmation,
    getProfile,
    updateProfile,
    changePassword,
    apiRequest,
    isAuthenticated,
    isVendor,
    isShopper,
    canSell,
    refreshAccessToken,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };
export default UserContext;