import React, { createContext, useContext, useState } from 'react';

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
  // Built-in wallet - always connected
  const [isConnected, setIsConnected] = useState(true);
  const [address, setAddress] = useState<string | null>('0x742d35Cc6663C0532d8c5E9C4267B53A0D7C9b1F');
  const [balance, setBalance] = useState('12.5623');

  const connectWallet = async () => {
    // Built-in wallet - already connected, just refresh state
    setIsConnected(true);
    setAddress('0x742d35Cc6663C0532d8c5E9C4267B53A0D7C9b1F');
    setBalance('12.5623');
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance('0.0');
  };

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    // Mock transaction
    const txHash = '0x' + Math.random().toString(16).substr(2, 40);
    
    // Simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update balance (mock deduction)
    const currentBalance = parseFloat(balance);
    const sentAmount = parseFloat(amount);
    setBalance((currentBalance - sentAmount - 0.001).toString()); // deduct amount + gas fee
    
    return txHash;
  };

  const refreshBalance = async () => {
    // Mock balance refresh
    if (isConnected) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBalance((parseFloat(balance) + Math.random() * 0.1).toString());
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
