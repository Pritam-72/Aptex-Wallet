// Receive transaction utilities for handling incoming payments

import { getBalanceForAddress, setBalanceForAddress } from './balanceStorage';
import { addTransactionToStorage } from './transactionStorage';

// Function to simulate receiving money from an external source
export const simulateReceiveTransaction = (toAddress: string, amount: string, fromAddress?: string) => {
  try {
    // Get current balance
    const currentBalance = parseFloat(getBalanceForAddress(toAddress));
    const receiveAmount = parseFloat(amount);
    
    // Update receiver balance (add amount)
    const newBalance = (currentBalance + receiveAmount).toFixed(6);
    setBalanceForAddress(toAddress, newBalance);
    
    // Generate a mock transaction hash
    const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Create transaction record for the receiver
    const transaction = {
      from: fromAddress || '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''), // External address
      to: toAddress,
      ethAmount: amount,
      aptosAmount: amount,
      inrAmount: parseFloat(amount) * 373, // Mock conversion rate
      timestamp: new Date(),
      txHash: txHash,
      type: 'received' as const,
      status: 'confirmed' as const,
      note: 'External transfer'
    };

    // Store transaction in localStorage
    addTransactionToStorage(transaction);
    
    console.log(`💰 Simulated receive transaction:`);
    console.log(`   To: ${toAddress}`);
    console.log(`   Amount: ${amount} APT`);
    console.log(`   New balance: ${newBalance} APT`);
    console.log(`   Transaction hash: ${txHash}`);
    
    return {
      success: true,
      newBalance,
      txHash,
      transaction
    };
  } catch (error) {
    console.error('Error simulating receive transaction:', error);
    throw error;
  }
};

// Function to create a payment request
export const createPaymentRequest = (receiverAddress: string, amount?: string, note?: string) => {
  const paymentRequest = {
    to: receiverAddress,
    amount: amount || '0',
    note: note || '',
    timestamp: new Date().toISOString(),
    qrData: `aptos:${receiverAddress}${amount ? `?amount=${amount}` : ''}${note ? `&note=${encodeURIComponent(note)}` : ''}`
  };
  
  return paymentRequest;
};

// Function to parse payment request from QR code or link
export const parsePaymentRequest = (data: string) => {
  try {
    // Handle Aptos payment URI format
    if (data.startsWith('aptos:')) {
      const url = new URL(data);
      const address = url.pathname;
      const amount = url.searchParams.get('amount');
      const note = url.searchParams.get('note');
      
      return {
        address,
        amount: amount || '',
        note: note || ''
      };
    }
    
    // Handle plain address
    if (data.startsWith('0x') && data.length >= 40) {
      return {
        address: data,
        amount: '',
        note: ''
      };
    }
    
    throw new Error('Invalid payment request format');
  } catch (error) {
    console.error('Error parsing payment request:', error);
    throw new Error('Could not parse payment request');
  }
};