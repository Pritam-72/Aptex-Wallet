import React, { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  account_type?: 'individual' | 'merchant' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const mockUser: User = {
      id: Math.random().toString(36),
      email,
      full_name: 'Demo User',
      account_type: 'individual'
    };
    setUser(mockUser);
    setLoading(false);
  };

  const signOut = async () => {
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
