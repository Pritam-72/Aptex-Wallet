// Payment request storage utilities for handling payment requests between wallets

import { addTransactionToStorage } from './transactionStorage';
import { getBalanceForAddress, setBalanceForAddress } from './balanceStorage';

export interface PaymentRequest {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  description?: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
  txHash?: string;
}

// Get current wallet's public key (same as in transactionStorage)
export const getCurrentPublicKey = (): string => {
  try {
    const walletData = localStorage.getItem('cryptal_wallet');
    if (!walletData) return '';
    
    const wallet = JSON.parse(walletData);
    if (!wallet.accounts || wallet.accounts.length === 0) return '';
    
    const currentIndex = wallet.currentAccountIndex || 0;
    return wallet.accounts[currentIndex]?.publicKey || '';
  } catch (error) {
    console.error('Error getting current public key:', error);
    return '';
  }
};

// Generate unique request ID
const generateRequestId = (): string => {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Store payment request
export const createPaymentRequest = (
  fromAddress: string,
  toAddress: string,
  amount: string,
  description?: string
): PaymentRequest => {
  const request: PaymentRequest = {
    id: generateRequestId(),
    fromAddress,
    toAddress,
    amount,
    description,
    timestamp: new Date(),
    status: 'pending'
  };

  // Store in sender's outgoing requests
  const senderKey = `payment_requests_sent_${fromAddress}`;
  const senderRequests = getStoredRequests(senderKey);
  senderRequests.push(request);
  localStorage.setItem(senderKey, JSON.stringify(senderRequests));

  // Store in receiver's incoming requests
  const receiverKey = `payment_requests_received_${toAddress}`;
  const receiverRequests = getStoredRequests(receiverKey);
  receiverRequests.push(request);
  localStorage.setItem(receiverKey, JSON.stringify(receiverRequests));

  console.log(`💸 Payment request created:`);
  console.log(`   From: ${fromAddress}`);
  console.log(`   To: ${toAddress}`);
  console.log(`   Amount: ${amount} APT`);
  console.log(`   Description: ${description || 'None'}`);

  return request;
};

// Get stored payment requests
const getStoredRequests = (key: string): PaymentRequest[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading payment requests:', error);
    return [];
  }
};

// Get incoming payment requests for current user
export const getIncomingPaymentRequests = (address: string): PaymentRequest[] => {
  const key = `payment_requests_received_${address}`;
  return getStoredRequests(key).filter(req => req.status === 'pending');
};

// Get outgoing payment requests for current user
export const getOutgoingPaymentRequests = (address: string): PaymentRequest[] => {
  const key = `payment_requests_sent_${address}`;
  return getStoredRequests(key);
};

// Accept payment request
export const acceptPaymentRequest = (requestId: string, userAddress: string): boolean => {
  try {
    // Find the request in incoming requests
    const incomingKey = `payment_requests_received_${userAddress}`;
    const incomingRequests = getStoredRequests(incomingKey);
    const requestIndex = incomingRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
      throw new Error('Payment request not found');
    }

    const request = incomingRequests[requestIndex];
    
    // Check if sender has sufficient balance
    const senderBalance = parseFloat(getBalanceForAddress(userAddress));
    const requestAmount = parseFloat(request.amount);
    
    if (senderBalance < requestAmount) {
      throw new Error('Insufficient balance to fulfill this request');
    }

    // Update balances
    const newSenderBalance = (senderBalance - requestAmount).toFixed(6);
    const receiverBalance = parseFloat(getBalanceForAddress(request.fromAddress));
    const newReceiverBalance = (receiverBalance + requestAmount).toFixed(6);
    
    setBalanceForAddress(userAddress, newSenderBalance);
    setBalanceForAddress(request.fromAddress, newReceiverBalance);

    // Generate transaction hash
    const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

    // Update request status
    request.status = 'accepted';
    request.txHash = txHash;

    // Update incoming requests
    incomingRequests[requestIndex] = request;
    localStorage.setItem(incomingKey, JSON.stringify(incomingRequests));

    // Update outgoing requests for the original requester
    const outgoingKey = `payment_requests_sent_${request.fromAddress}`;
    const outgoingRequests = getStoredRequests(outgoingKey);
    const outgoingIndex = outgoingRequests.findIndex(req => req.id === requestId);
    if (outgoingIndex !== -1) {
      outgoingRequests[outgoingIndex] = request;
      localStorage.setItem(outgoingKey, JSON.stringify(outgoingRequests));
    }

    // Create transaction records for both parties
    const senderTransaction = {
      from: userAddress,
      to: request.fromAddress,
      ethAmount: request.amount,
      aptosAmount: request.amount,
      inrAmount: parseFloat(request.amount) * 373,
      timestamp: new Date(),
      txHash: txHash,
      type: 'sent' as const,
      status: 'confirmed' as const,
      note: `Payment request fulfilled: ${request.description || 'No description'}`
    };

    const receiverTransaction = {
      from: userAddress,
      to: request.fromAddress,
      ethAmount: request.amount,
      aptosAmount: request.amount,
      inrAmount: parseFloat(request.amount) * 373,
      timestamp: new Date(),
      txHash: txHash,
      type: 'received' as const,
      status: 'confirmed' as const,
      note: `Payment request accepted: ${request.description || 'No description'}`
    };

    // Store transactions
    addTransactionToStorage(senderTransaction);
    // For receiver transaction, we need to store it with their public key
    const receiverPublicKey = getCurrentPublicKeyForAddress(request.fromAddress);
    if (receiverPublicKey) {
      const receiverStorageKey = `transactions_${receiverPublicKey}`;
      const receiverTransactions = JSON.parse(localStorage.getItem(receiverStorageKey) || '[]');
      receiverTransactions.push(receiverTransaction);
      localStorage.setItem(receiverStorageKey, JSON.stringify(receiverTransactions));
    }

    console.log(`✅ Payment request accepted:`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Amount: ${request.amount} APT`);
    console.log(`   From: ${userAddress} (new balance: ${newSenderBalance})`);
    console.log(`   To: ${request.fromAddress} (new balance: ${newReceiverBalance})`);

    return true;
  } catch (error) {
    console.error('Error accepting payment request:', error);
    throw error;
  }
};

// Reject payment request
export const rejectPaymentRequest = (requestId: string, userAddress: string): boolean => {
  try {
    // Find the request in incoming requests
    const incomingKey = `payment_requests_received_${userAddress}`;
    const incomingRequests = getStoredRequests(incomingKey);
    const requestIndex = incomingRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
      throw new Error('Payment request not found');
    }

    const request = incomingRequests[requestIndex];
    
    // Update request status
    request.status = 'rejected';

    // Update incoming requests
    incomingRequests[requestIndex] = request;
    localStorage.setItem(incomingKey, JSON.stringify(incomingRequests));

    // Update outgoing requests for the original requester
    const outgoingKey = `payment_requests_sent_${request.fromAddress}`;
    const outgoingRequests = getStoredRequests(outgoingKey);
    const outgoingIndex = outgoingRequests.findIndex(req => req.id === requestId);
    if (outgoingIndex !== -1) {
      outgoingRequests[outgoingIndex] = request;
      localStorage.setItem(outgoingKey, JSON.stringify(outgoingRequests));
    }

    console.log(`❌ Payment request rejected:`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Amount: ${request.amount} APT`);

    return true;
  } catch (error) {
    console.error('Error rejecting payment request:', error);
    throw error;
  }
};

// Helper function to get public key for an address (simplified - in real app you'd need address-to-pubkey mapping)
const getCurrentPublicKeyForAddress = (address: string): string | null => {
  try {
    const walletData = localStorage.getItem('cryptal_wallet');
    if (!walletData) return null;
    
    const wallet = JSON.parse(walletData);
    if (!wallet.accounts || wallet.accounts.length === 0) return null;
    
    // Find account with matching address
    const account = wallet.accounts.find((acc: any) => acc.address === address);
    return account?.publicKey || null;
  } catch (error) {
    console.error('Error getting public key for address:', error);
    return null;
  }
};

// Delete old completed requests (cleanup utility)
export const cleanupOldRequests = (address: string, daysOld: number = 7): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Clean incoming requests
  const incomingKey = `payment_requests_received_${address}`;
  const incomingRequests = getStoredRequests(incomingKey);
  const filteredIncoming = incomingRequests.filter(req => 
    req.status === 'pending' || new Date(req.timestamp) > cutoffDate
  );
  localStorage.setItem(incomingKey, JSON.stringify(filteredIncoming));

  // Clean outgoing requests
  const outgoingKey = `payment_requests_sent_${address}`;
  const outgoingRequests = getStoredRequests(outgoingKey);
  const filteredOutgoing = outgoingRequests.filter(req => 
    req.status === 'pending' || new Date(req.timestamp) > cutoffDate
  );
  localStorage.setItem(outgoingKey, JSON.stringify(filteredOutgoing));
};