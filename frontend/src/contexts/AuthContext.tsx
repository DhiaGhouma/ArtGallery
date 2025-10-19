import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await api.checkAuth();
      if (response.authenticated && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to check authentication:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    await api.register({ username, email, password });
    
    // **FIX: Check authentication after registration to get complete user data**
    // This ensures the session cookie is properly set and user state is updated
    const authResponse = await api.checkAuth();
    if (authResponse.authenticated && authResponse.user) {
      setUser(authResponse.user);
    }
  };

  const login = async (username: string, password: string) => {
    await api.login({ username, password });
    
    // **IMPROVEMENT: Always use checkAuth for consistency**
    // This ensures we get the complete user profile data
    const authResponse = await api.checkAuth();
    if (authResponse.authenticated && authResponse.user) {
      setUser(authResponse.user);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  // Add refresh user function
  const refreshUser = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        logout,
        login,
        isAuthenticated: !!user,
        loading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}