import { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: 'client' | 'provider' | 'partner' | 'admin';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'client' | 'provider' | 'partner' | 'admin';
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
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
          error: null,
        });
        await SecureStore.setItemAsync('isAuthenticated', 'true');
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        await SecureStore.deleteItemAsync('isAuthenticated');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setState({
          user: data,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        await SecureStore.setItemAsync('isAuthenticated', 'true');
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.message || 'Erro ao fazer login',
        }));
        return { success: false, message: data.message || 'Erro ao fazer login' };
      }
    } catch (error) {
      const message = 'Erro de conexão. Tente novamente.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; message?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setState({
          user: result,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        await SecureStore.setItemAsync('isAuthenticated', 'true');
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.message || 'Erro ao criar conta',
        }));
        return { success: false, message: result.message || 'Erro ao criar conta' };
      }
    } catch (error) {
      const message = 'Erro de conexão. Tente novamente.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return { success: false, message };
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
        error: null,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const getGoogleAuthUrl = useCallback(() => {
    return `${API_URL}/api/auth/google`;
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...state,
    checkAuth,
    login,
    register,
    logout,
    clearError,
    getGoogleAuthUrl,
  };
}
