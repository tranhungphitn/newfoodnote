import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import type {UserRole} from '../types/models';

const HARDCODED_ADMIN_PASSWORD = '1478965';
const ADMIN_SESSION_KEY = 'my_recipe_notes_admin_session';

interface AuthContextValue {
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  loginWithPassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readInitialRole(): UserRole {
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === '1' ? 'admin' : 'guest';
  } catch {
    return 'guest';
  }
}

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [role, setRole] = useState<UserRole>(readInitialRole);

  const loginWithPassword = useCallback(async (password: string) => {
    if (!password) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    if (password !== HARDCODED_ADMIN_PASSWORD) {
      throw new Error('Mật khẩu không chính xác.');
    }

    try {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    } catch {
      // Ignore storage restrictions in private browsing
    }
    setRole('admin');
  }, []);

  const logout = useCallback(async () => {
    try {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore
    }
    setRole('guest');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      isAdmin: role === 'admin',
      loading: false,
      loginWithPassword,
      logout,
    }),
    [role, loginWithPassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
