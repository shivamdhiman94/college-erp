import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { useToast } from '../hooks/useToast';
import { ROLE_REDIRECTS } from '../utils/constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('college_erp_token'));
  const [isLoading, setIsLoading] = useState(true);
  const { success, error, info } = useToast();

  // Handle unauthorized session expiration
  const logout = useCallback((message = null) => {
    localStorage.removeItem('college_erp_token');
    localStorage.removeItem('college_erp_refresh_token');
    localStorage.removeItem('college_erp_user');
    setUser(null);
    setToken(null);
    if (message) {
      info(message);
    }
  }, [info]);

  // Verify and fetch authenticated user on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('college_erp_token');
      if (storedToken) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          setToken(storedToken);
        } catch (err) {
          console.error('Session initialization failed:', err);
          logout('Session expired. Please log in again.');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    const handleUnauthorizedEvent = () => {
      logout('Your session has expired. Please log in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
    };
  }, [logout]);

  // Login handler
  const login = async (username_or_email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(username_or_email, password);
      
      // Store tokens
      localStorage.setItem('college_erp_token', data.access_token);
      localStorage.setItem('college_erp_refresh_token', data.refresh_token);
      
      setToken(data.access_token);

      // Fetch rich profile
      const profile = await authService.getMe();
      setUser(profile);
      localStorage.setItem('college_erp_user', JSON.stringify(profile));

      success(`Welcome back, ${profile.full_name || profile.username}!`);
      return { success: true, user: profile, redirectPath: ROLE_REDIRECTS[profile.role] || '/login' };
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Authentication failed. Please verify your credentials.';
      error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Change password handler
  const changePassword = async (oldPassword, newPassword) => {
    try {
      await authService.changePassword(oldPassword, newPassword);
      success('Password changed successfully.');
      return { success: true };
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to change password. Please check your current password.';
      error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Reload current user profile
  const reloadUser = async () => {
    try {
      const profile = await authService.getMe();
      setUser(profile);
      localStorage.setItem('college_erp_user', JSON.stringify(profile));
    } catch (err) {
      console.error('Failed to reload user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        changePassword,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
