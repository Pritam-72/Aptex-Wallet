import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  walletAddress: string;
  full_name?: string;
  account_type?: 'user' | 'admin';
  hasWallet: boolean;
  createdAt: string;
}

interface WalletData {
  address: string;
  mnemonic: string;
  privateKey: string;
  publicKey: string;
  password: string;
  encrypted: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasWallet: boolean;
  createWallet: (walletData: WalletData) => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);

  // Check if user has an existing wallet on mount
  useEffect(() => {
    const checkExistingWallet = () => {
      try {
        const storedWallet = localStorage.getItem('aptos_wallet');
        if (storedWallet) {
          const walletData = JSON.parse(storedWallet);
          setHasWallet(true);
          
          // Check if user is already unlocked
          const unlockedUser = localStorage.getItem('aptos_user');
          if (unlockedUser) {
            setUser(JSON.parse(unlockedUser));
          }
        }
      } catch (error) {
        console.error('Error checking existing wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingWallet();
  }, []);

  const createWallet = async (walletData: WalletData) => {
    try {
      setLoading(true);
      
      // Store encrypted wallet data
      const encryptedWalletData = {
        ...walletData,
        // In a real implementation, properly encrypt the sensitive data
        encrypted: true
      };
      
      localStorage.setItem('aptos_wallet', JSON.stringify(encryptedWalletData));
      
      // Create user session
      const newUser: User = {
        id: walletData.address,
        walletAddress: walletData.address,
        full_name: 'Wallet User',
        account_type: 'user',
        hasWallet: true,
        createdAt: walletData.createdAt
      };
      
      localStorage.setItem('aptos_user', JSON.stringify(newUser));
      
      setUser(newUser);
      setHasWallet(true);
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unlockWallet = async (password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const storedWallet = localStorage.getItem('aptos_wallet');
      if (!storedWallet) {
        throw new Error('No wallet found');
      }
      
      const walletData = JSON.parse(storedWallet);
      
      // In a real implementation, verify the password against encrypted data
      if (walletData.password !== password) {
        return false;
      }
      
      // Create user session
      const unlockedUser: User = {
        id: walletData.address,
        walletAddress: walletData.address,
        full_name: 'Wallet User',
        account_type: 'user',
        hasWallet: true,
        createdAt: walletData.createdAt
      };
      
      localStorage.setItem('aptos_user', JSON.stringify(unlockedUser));
      setUser(unlockedUser);
      
      return true;
    } catch (error) {
      console.error('Error unlocking wallet:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('aptos_user');
    setUser(null);
    // Keep wallet data for next unlock
  };

  const value = {
    user,
    loading,
    hasWallet,
    createWallet,
    unlockWallet,
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
