import { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        await SecureStore.setItemAsync('isAuthenticated', 'true');
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        await SecureStore.deleteItemAsync('isAuthenticated');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await SecureStore.deleteItemAsync('isAuthenticated');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...state,
    checkAuth,
    logout,
  };
}
