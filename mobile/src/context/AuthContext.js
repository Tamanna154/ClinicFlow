import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { clearToken, setUnauthorizedCallback } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearToken();
  }, []);

  useEffect(() => {
    setUnauthorizedCallback(() => {
      logout();
      Alert.alert(
        'Session Expired',
        'Your session has expired or is invalid. Please sign in again.'
      );
    });
    return () => {
      setUnauthorizedCallback(null);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

