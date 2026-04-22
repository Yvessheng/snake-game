import { useState, useCallback } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

const TOKEN_KEY = 'snake_token';
const USER_KEY = 'snake_user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const result = await api.register(username, email, password);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  return { user, login, register, logout, getToken, isAuthenticated: !!user };
}
