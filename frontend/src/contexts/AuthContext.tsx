import React, { createContext, useContext, useState } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  login: (username: string, password: string) => Promise<void>; // ✅ doit être ici
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const register = async (username: string, email: string, password: string) => {
    const response = await api.register({ username, email, password });
    setUser(response.user);
  };

    // 🔹 Login (connexion)
  const login = async (username: string, password: string) => {
    const response = await api.login({ username, password });
    if (response.user) {
      setUser(response.user);
    } else {
      // Si le backend ne renvoie pas les infos du user, on peut les récupérer via /profile/
      try {
        const profile = await api.getProfile();
        setUser(profile);
      } catch (error) {
        console.error('Failed to fetch profile after login', error);
      }
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        logout,
        login,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
