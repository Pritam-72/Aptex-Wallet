import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  sendTransaction: (to: string, amount: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, hasWallet } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.0');

  // Update wallet connection status based on authentication
  useEffect(() => {
    if (user && hasWallet) {
      setIsConnected(true);
      setAddress(user.walletAddress);
      setBalance('12.5623'); // Mock initial balance
    } else {
      setIsConnected(false);
      setAddress(null);
      setBalance('0.0');
    }
  }, [user, hasWallet]);

  const connectWallet = async () => {
    if (user && hasWallet) {
      setIsConnected(true);
      setAddress(user.walletAddress);
      setBalance('12.5623');
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance('0.0');
  };

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    // Mock transaction
    const txHash = '0x' + Math.random().toString(16).substr(2, 40);
    
    // Simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update balance (mock deduction)
    const currentBalance = parseFloat(balance);
    const sentAmount = parseFloat(amount);
    const newBalance = currentBalance - sentAmount - 0.001; // deduct amount + gas fee
    setBalance(Math.max(0, newBalance).toString());
    
    return txHash;
  };

  const refreshBalance = async () => {
    if (isConnected && address) {
      // Simulate API call to fetch real balance
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock balance update
      setBalance((Math.random() * 20 + 5).toFixed(4));
    }
  };

  const value = {
    isConnected,
    address,
    balance,
    connect: connectWallet,
    disconnect: disconnectWallet,
    refreshBalance,
    sendTransaction
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
