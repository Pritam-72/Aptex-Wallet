import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'register_id';
  amount?: string;
  to?: string;
  from?: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  walletId?: string;
}

interface WalletData {
  balance: string;
  walletId?: string;
  transactions: Transaction[];
  identityVerified: boolean;
  createdAt: number;
  lastUpdated: number;
}

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  walletId?: string;
  transactions: Transaction[];
  identityVerified: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  sendTransaction: (to: string, amount: string) => Promise<string>;
  registerWalletId: (walletId: string) => Promise<string>;
  setIdentityVerified: (verified: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, hasWallet } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.0');
  const [walletId, setWalletId] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [identityVerified, setIdentityVerified] = useState(false);

  // Generate storage key based on address
  const getStorageKey = (addr: string) => `wallet_data_${addr}`;

  // Default wallet data for new accounts
  const getDefaultWalletData = (): WalletData => ({
    balance: '12.87',
    transactions: [
      {
        hash: '0x' + Math.random().toString(16).substr(2, 40),
        type: 'receive',
        amount: '12.87',
        from: '0x742d35Cc6634C0532925a3b8D46b19d5Eb8e5B39',
        timestamp: Date.now() - 86400000, // 1 day ago
        status: 'completed'
      },
      {
        hash: '0x' + Math.random().toString(16).substr(2, 40),
        type: 'send',
        amount: '2.5',
        to: '0x8ba1f109551bD432803012645Hac136c34B4e2D2',
        timestamp: Date.now() - 43200000, // 12 hours ago
        status: 'completed'
      }
    ],
    identityVerified: false,
    createdAt: Date.now() - 604800000, // 1 week ago
    lastUpdated: Date.now()
  });

  // Load wallet data from localStorage
  const loadWalletData = (addr: string): WalletData => {
    try {
      const stored = localStorage.getItem(getStorageKey(addr));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
    return getDefaultWalletData();
  };

  // Save wallet data to localStorage
  const saveWalletData = (addr: string, data: WalletData) => {
    try {
      data.lastUpdated = Date.now();
      localStorage.setItem(getStorageKey(addr), JSON.stringify(data));
    } catch (error) {
      console.error('Error saving wallet data:', error);
    }
  };

  // Update wallet connection status based on authentication
  useEffect(() => {
    if (user && hasWallet && user.walletAddress) {
      setIsConnected(true);
      setAddress(user.walletAddress);
      
      // Load data from localStorage
      const walletData = loadWalletData(user.walletAddress);
      setBalance(walletData.balance);
      setWalletId(walletData.walletId);
      setTransactions(walletData.transactions);
      setIdentityVerified(walletData.identityVerified);
    } else {
      setIsConnected(false);
      setAddress(null);
      setBalance('0.0');
      setWalletId(undefined);
      setTransactions([]);
      setIdentityVerified(false);
    }
  }, [user, hasWallet]);

  const connectWallet = async () => {
    if (user && hasWallet && user.walletAddress) {
      setIsConnected(true);
      setAddress(user.walletAddress);
      
      // Load data from localStorage
      const walletData = loadWalletData(user.walletAddress);
      setBalance(walletData.balance);
      setWalletId(walletData.walletId);
      setTransactions(walletData.transactions);
      setIdentityVerified(walletData.identityVerified);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance('0.0');
    setWalletId(undefined);
    setTransactions([]);
    setIdentityVerified(false);
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
    const newBalance = Math.max(0, currentBalance - sentAmount - 0.001); // deduct amount + gas fee
    
    // Create transaction record
    const transaction: Transaction = {
      hash: txHash,
      type: 'send',
      amount,
      to,
      timestamp: Date.now(),
      status: 'completed'
    };

    // Update state
    const updatedBalance = newBalance.toString();
    const updatedTransactions = [transaction, ...transactions];
    
    setBalance(updatedBalance);
    setTransactions(updatedTransactions);

    // Save to localStorage
    const walletData = loadWalletData(address);
    walletData.balance = updatedBalance;
    walletData.transactions = updatedTransactions;
    saveWalletData(address, walletData);
    
    return txHash;
  };

  const refreshBalance = async () => {
    if (isConnected && address) {
      // Simulate API call to fetch real balance
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load current data and potentially add a small random variation
      const walletData = loadWalletData(address);
      const currentBalance = parseFloat(walletData.balance);
      const variation = (Math.random() - 0.5) * 0.1; // Small random variation
      const newBalance = Math.max(0, currentBalance + variation).toFixed(4);
      
      setBalance(newBalance);
      
      // Save updated balance
      walletData.balance = newBalance;
      saveWalletData(address, walletData);
    }
  };

  const registerWalletId = async (newWalletId: string): Promise<string> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    // Mock wallet ID registration
    const txHash = '0x' + Math.random().toString(16).substr(2, 40);
    
    // Simulate registration processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Create transaction record
    const transaction: Transaction = {
      hash: txHash,
      type: 'register_id',
      timestamp: Date.now(),
      status: 'completed',
      walletId: newWalletId
    };

    // Update state
    const updatedTransactions = [transaction, ...transactions];
    setWalletId(newWalletId);
    setTransactions(updatedTransactions);

    // Save to localStorage
    const walletData = loadWalletData(address);
    walletData.walletId = newWalletId;
    walletData.transactions = updatedTransactions;
    saveWalletData(address, walletData);
    
    return txHash;
  };

  const handleSetIdentityVerified = (verified: boolean) => {
    if (!address) return;
    
    setIdentityVerified(verified);
    
    // Save to localStorage
    const walletData = loadWalletData(address);
    walletData.identityVerified = verified;
    saveWalletData(address, walletData);
  };

  const value = {
    isConnected,
    address,
    balance,
    walletId,
    transactions,
    identityVerified,
    connect: connectWallet,
    disconnect: disconnectWallet,
    refreshBalance,
    sendTransaction,
    registerWalletId,
    setIdentityVerified: handleSetIdentityVerified
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
