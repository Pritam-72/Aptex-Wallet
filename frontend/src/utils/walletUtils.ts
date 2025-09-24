import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

// Initialize Aptos client for devnet
const config = new AptosConfig({ network: Network.DEVNET });
export const aptos = new Aptos(config);

export interface WalletAccount {
  address: string;
  privateKey: string;
  publicKey: string;
  accountIndex: number;
}

export interface StoredWallet {
  seedPhrase: string;
  accounts: WalletAccount[];
  currentAccountIndex: number;
}

// LocalStorage keys
const WALLET_STORAGE_KEY = 'cryptal_wallet';
const ACCOUNT_COUNT_KEY = 'cryptal_account_count';

// Generate a new wallet with seed phrase
export const generateNewWallet = (): { seedPhrase: string; account: Account } => {
  const account = Account.generate();
  // For demo purposes, we'll use a simplified seed phrase approach
  // In production, you'd want to use proper BIP39 mnemonic generation
  const seedPhrase = generateSeedPhrase();
  
  return {
    seedPhrase,
    account
  };
};

// Generate a simple seed phrase (in production, use proper BIP39)
const generateSeedPhrase = (): string => {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
    'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
    'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'against', 'age',
    'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm',
    'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost',
    'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing',
    'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle'
  ];
  
  const selectedWords = [];
  for (let i = 0; i < 12; i++) {
    selectedWords.push(words[Math.floor(Math.random() * words.length)]);
  }
  
  return selectedWords.join(' ');
};

// Get wallet from localStorage
export const getStoredWallet = (): StoredWallet | null => {
  try {
    const walletData = localStorage.getItem(WALLET_STORAGE_KEY);
    if (walletData) {
      return JSON.parse(walletData);
    }
    return null;
  } catch (error) {
    console.error('Error reading wallet from localStorage:', error);
    return null;
  }
};

// Get account count from localStorage
export const getAccountCount = (): number => {
  try {
    const count = localStorage.getItem(ACCOUNT_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error reading account count:', error);
    return 0;
  }
};

// Save wallet to localStorage
export const saveWallet = (wallet: StoredWallet): void => {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    localStorage.setItem(ACCOUNT_COUNT_KEY, wallet.accounts.length.toString());
  } catch (error) {
    console.error('Error saving wallet to localStorage:', error);
    throw new Error('Failed to save wallet');
  }
};

// Create a new wallet and save it
export const createNewWallet = (): StoredWallet => {
  const { seedPhrase, account } = generateNewWallet();
  
  const walletAccount: WalletAccount = {
    address: account.accountAddress.toString(),
    privateKey: account.privateKey.toString(),
    publicKey: account.publicKey.toString(),
    accountIndex: 0
  };
  
  const wallet: StoredWallet = {
    seedPhrase,
    accounts: [walletAccount],
    currentAccountIndex: 0
  };
  
  saveWallet(wallet);
  return wallet;
};

// Add a new account to existing wallet
export const addNewAccount = (): WalletAccount | null => {
  const wallet = getStoredWallet();
  if (!wallet) {
    return null;
  }
  
  const newAccount = Account.generate();
  const accountIndex = wallet.accounts.length;
  
  const walletAccount: WalletAccount = {
    address: newAccount.accountAddress.toString(),
    privateKey: newAccount.privateKey.toString(),
    publicKey: newAccount.publicKey.toString(),
    accountIndex
  };
  
  wallet.accounts.push(walletAccount);
  saveWallet(wallet);
  
  return walletAccount;
};

// Get current account
export const getCurrentAccount = (): WalletAccount | null => {
  const wallet = getStoredWallet();
  if (!wallet || wallet.accounts.length === 0) {
    return null;
  }
  
  return wallet.accounts[wallet.currentAccountIndex] || wallet.accounts[0];
};

// Switch to different account
export const switchAccount = (accountIndex: number): boolean => {
  const wallet = getStoredWallet();
  if (!wallet || accountIndex >= wallet.accounts.length || accountIndex < 0) {
    return false;
  }
  
  wallet.currentAccountIndex = accountIndex;
  saveWallet(wallet);
  return true;
};

// Get account balance
export const getAccountBalance = async (address: string): Promise<string> => {
  try {
    const resources = await aptos.getAccountResources({
      accountAddress: address
    });
    
    const accountResource = resources.find(
      (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    );
    
    if (accountResource) {
      const balance = (accountResource.data as { coin: { value: string } }).coin.value;
      // Convert from octas to APT (1 APT = 100,000,000 octas)
      return (parseInt(balance) / 100000000).toString();
    }
    
    return '0';
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0';
  }
};

// Get account transactions
export const getAccountTransactions = async (address: string, limit: number = 25) => {
  try {
    const transactions = await aptos.getAccountTransactions({
      accountAddress: address,
      options: {
        limit
      }
    });
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Fund account on devnet (for testing)
export const fundAccount = async (address: string): Promise<boolean> => {
  try {
    await aptos.fundAccount({
      accountAddress: address,
      amount: 100000000 // 1 APT in octas
    });
    return true;
  } catch (error) {
    console.error('Error funding account:', error);
    return false;
  }
};

// Clear all wallet data (logout)
export const clearWalletData = (): void => {
  localStorage.removeItem(WALLET_STORAGE_KEY);
  localStorage.removeItem(ACCOUNT_COUNT_KEY);
};