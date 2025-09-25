// Transaction storage utilities for localStorage

interface PaymentTransaction {
  from: string;
  to: string;
  ethAmount: string;
  aptosAmount: string;
  inrAmount: number;
  timestamp: Date;
  txHash?: string;
  type: 'sent' | 'received' | 'other';
  status: 'confirmed' | 'failed';
  gasUsed?: string;
  function?: string;
  note?: string;
}

// Helper function to get current public key for localStorage key
export const getCurrentPublicKey = (): string | null => {
  try {
    const walletData = localStorage.getItem('cryptal_wallet');
    if (walletData) {
      const parsedData = JSON.parse(walletData);
      const currentIndex = parsedData.currentAccountIndex || 0;
      return parsedData.accounts?.[currentIndex]?.publicKey || null;
    }
  } catch (error) {
    console.error('Error reading public key from localStorage:', error);
  }
  return null;
};

// Helper function to get transactions from localStorage
export const getStoredTransactions = (publicKey: string): PaymentTransaction[] => {
  try {
    const storedTransactions = localStorage.getItem(publicKey);
    if (storedTransactions) {
      const parsed = JSON.parse(storedTransactions);
      // Convert timestamp strings back to Date objects
      return parsed.map((tx: any) => ({
        ...tx,
        timestamp: new Date(tx.timestamp)
      }));
    }
  } catch (error) {
    console.error('Error reading transactions from localStorage:', error);
  }
  return [];
};

// Helper function to save transactions to localStorage
export const saveTransactionsToStorage = (publicKey: string, transactions: PaymentTransaction[]) => {
  try {
    localStorage.setItem(publicKey, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions to localStorage:', error);
  }
};

// Function to add a new transaction to localStorage for both sender and receiver
export const addTransactionToStorage = (transaction: PaymentTransaction) => {
  try {
    // Get current wallet data to find public keys
    const walletData = localStorage.getItem('cryptal_wallet');
    if (!walletData) return;

    const parsedWalletData = JSON.parse(walletData);
    
    // Find sender's public key
    const senderAccount = parsedWalletData.accounts.find((acc: any) => acc.address === transaction.from);
    if (senderAccount) {
      const senderTransactions = getStoredTransactions(senderAccount.publicKey);
      senderTransactions.push(transaction);
      saveTransactionsToStorage(senderAccount.publicKey, senderTransactions);
      console.log('✅ Transaction saved for sender:', senderAccount.publicKey);
    }

    // Find receiver's public key (if they exist in our wallet)
    const receiverAccount = parsedWalletData.accounts.find((acc: any) => acc.address === transaction.to);
    if (receiverAccount) {
      // Create a received transaction for the receiver
      const receivedTransaction: PaymentTransaction = {
        ...transaction,
        type: 'received'
      };
      const receiverTransactions = getStoredTransactions(receiverAccount.publicKey);
      receiverTransactions.push(receivedTransaction);
      saveTransactionsToStorage(receiverAccount.publicKey, receiverTransactions);
      console.log('✅ Transaction saved for receiver:', receiverAccount.publicKey);
    }
  } catch (error) {
    console.error('Error adding transaction to storage:', error);
  }
};

// Function to get all transactions for current wallet
export const getCurrentWalletTransactions = (): PaymentTransaction[] => {
  const publicKey = getCurrentPublicKey();
  if (!publicKey) return [];
  return getStoredTransactions(publicKey);
};