// Wallet balance utilities for localStorage

// Helper function to get current wallet data
export const getCurrentWalletData = () => {
  try {
    const walletData = localStorage.getItem('cryptal_wallet');
    if (walletData) {
      return JSON.parse(walletData);
    }
  } catch (error) {
    console.error('Error reading wallet data from localStorage:', error);
  }
  return null;
};

// Helper function to save wallet data
export const saveWalletData = (walletData: any) => {
  try {
    localStorage.setItem('cryptal_wallet', JSON.stringify(walletData));
  } catch (error) {
    console.error('Error saving wallet data to localStorage:', error);
  }
};

// Function to get balance for a specific address
export const getBalanceForAddress = (address: string): string => {
  try {
    const balanceKey = `balance_${address}`;
    const storedBalance = localStorage.getItem(balanceKey);
    return storedBalance || '0';
  } catch (error) {
    console.error('Error reading balance from localStorage:', error);
    return '0';
  }
};

// Function to set balance for a specific address
export const setBalanceForAddress = (address: string, balance: string) => {
  try {
    const balanceKey = `balance_${address}`;
    localStorage.setItem(balanceKey, balance);
    console.log(`✅ Balance updated for ${address}: ${balance} APT`);
  } catch (error) {
    console.error('Error saving balance to localStorage:', error);
  }
};

// Function to update balances when sending money
export const updateBalancesAfterTransaction = (fromAddress: string, toAddress: string, amount: string) => {
  try {
    // Get current balances
    const senderBalance = parseFloat(getBalanceForAddress(fromAddress));
    const receiverBalance = parseFloat(getBalanceForAddress(toAddress));
    const transactionAmount = parseFloat(amount);

    // Check if sender has sufficient balance
    if (senderBalance < transactionAmount) {
      throw new Error('Insufficient balance');
    }

    // Update sender balance (subtract amount)
    const newSenderBalance = (senderBalance - transactionAmount).toString();
    setBalanceForAddress(fromAddress, newSenderBalance);

    // Update receiver balance (add amount)
    const newReceiverBalance = (receiverBalance + transactionAmount).toString();
    setBalanceForAddress(toAddress, newReceiverBalance);

    console.log(`💰 Transaction processed: ${fromAddress} -> ${toAddress}`);
    console.log(`   Sender balance: ${senderBalance} -> ${newSenderBalance} APT`);
    console.log(`   Receiver balance: ${receiverBalance} -> ${newReceiverBalance} APT`);

    return {
      senderBalance: newSenderBalance,
      receiverBalance: newReceiverBalance
    };
  } catch (error) {
    console.error('Error updating balances:', error);
    throw error;
  }
};

// Function to initialize balance for new accounts
export const initializeAccountBalance = (address: string, initialBalance: string = '100') => {
  const existingBalance = getBalanceForAddress(address);
  if (existingBalance === '0') {
    setBalanceForAddress(address, initialBalance);
    console.log(`🆕 Initialized balance for new account ${address}: ${initialBalance} APT`);
  }
};

// Function to get current account balance
export const getCurrentAccountBalance = (): string => {
  try {
    const walletData = getCurrentWalletData();
    if (walletData) {
      const currentIndex = walletData.currentAccountIndex || 0;
      const currentAccount = walletData.accounts?.[currentIndex];
      if (currentAccount) {
        return getBalanceForAddress(currentAccount.address);
      }
    }
  } catch (error) {
    console.error('Error getting current account balance:', error);
  }
  return '0';
};