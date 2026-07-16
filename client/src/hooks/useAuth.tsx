import * as React from 'react';
import type { User } from '@/types';
import * as authService from '@/api/auth.service';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'nha_session_token';
const USER_KEY = 'nha_session_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const storedUser = sessionStorage.getItem(USER_KEY);
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        sessionStorage.removeItem(USER_KEY);
      }
    }
    setIsInitializing(false);
  }, []);

  // Session-expiry handling: a 401 anywhere in the app clears the local
  // session so ProtectedRoute redirects to /login on the next render.
  React.useEffect(() => {
    function handleUnauthorized() {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      setUser(null);
    }
    window.addEventListener('nha:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('nha:unauthorized', handleUnauthorized);
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
    const result = await authService.login({ username, password });
    sessionStorage.setItem(TOKEN_KEY, result.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
  }, []);

  const logout = React.useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({ user, isAuthenticated: !!user, isInitializing, login, logout }),
    [user, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
