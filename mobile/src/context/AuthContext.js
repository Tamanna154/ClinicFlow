import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 1,
  name: 'Admin',
  username: 'doctor@gmail.com',
  role: 'DOCTOR',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEFAULT_USER);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
