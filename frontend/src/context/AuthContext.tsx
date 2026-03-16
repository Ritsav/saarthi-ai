import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import api from '@/config/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    profile?: {
      contact_number?: string;
      home_phone?: string;
      contact_phone?: string;
      contact_email?: string;
    }
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function parseAuthPayload(payload: unknown): { token: string; user: User } {
  const safe = payload as { token?: string; user?: User; data?: { token?: string; user?: User } };
  if (safe?.token && safe?.user) return { token: safe.token, user: safe.user };
  if (safe?.data?.token && safe?.data?.user) return { token: safe.data.token, user: safe.data.user };
  throw new Error('Unexpected auth response format');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('saarthi_token'),
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('saarthi_token');
      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        const user = (response.data?.data?.user || response.data?.user) as User;
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('saarthi_token');
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    };

    void validateToken();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, user } = parseAuthPayload(response.data);
    localStorage.setItem('saarthi_token', token);
    setState({ user, token, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      profile?: {
        contact_number?: string;
        home_phone?: string;
        contact_phone?: string;
        contact_email?: string;
      }
    ) => {
      const response = await api.post('/api/auth/register', { email, password, name, ...profile });
      const { token, user } = parseAuthPayload(response.data);
      localStorage.setItem('saarthi_token', token);
      setState({ user, token, isAuthenticated: true, isLoading: false });
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('saarthi_token');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  const value = useMemo(() => ({ ...state, login, register, logout }), [state, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
