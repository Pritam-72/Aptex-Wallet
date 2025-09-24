// Wallet utility functions for Aptos blockchain
// Real Aptos SDK integration for devnet

import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
  AccountAddress,
  AnyRawTransaction,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import * as bip39 from 'bip39';

// Configure Aptos client for devnet
const config = new AptosConfig({ network: Network.DEVNET });
export const aptos = new Aptos(config);

export interface AptosWalletData {
  address: string;
  mnemonic: string;
  privateKey: string;
  publicKey: string;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  gasUsed?: number;
  message?: string;
}

/**
 * Generate a new Aptos wallet using the official Aptos SDK with proper BIP39 mnemonic
 */
export const generateAptosWallet = async (): Promise<AptosWalletData> => {
  try {
    // Generate proper BIP39 mnemonic phrase
    const mnemonic = generateMnemonic();
    
    // Validate the mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Generated invalid mnemonic');
    }
    
    // Create account from mnemonic using standard derivation path
    const account = Account.fromDerivationPath({
      path: "m/44'/637'/0'/0'/0'",
      mnemonic: mnemonic,
    });
    
    // Get the derived information
    const privateKey = account.privateKey.toString();
    const publicKey = account.publicKey.toString();
    const address = account.accountAddress.toString();
    
    return {
      address,
      mnemonic,
      privateKey,
      publicKey
    };
  } catch (error) {
    console.error('Error generating Aptos wallet:', error);
    throw new Error('Failed to generate wallet');
  }
};

/**
 * Generate a proper BIP39 mnemonic phrase
 */
function generateMnemonic(): string {
  // Generate 128 bits of entropy for 12-word mnemonic
  return bip39.generateMnemonic();
}

/**
 * Import wallet from mnemonic phrase using Aptos SDK
 */
export const importWalletFromMnemonic = async (mnemonic: string): Promise<AptosWalletData> => {
  try {
    const cleanedMnemonic = mnemonic.trim().toLowerCase();
    const words = cleanedMnemonic.split(/\s+/);
    
    // Validate word count
    if (words.length !== 12 && words.length !== 24) {
      throw new Error('Invalid mnemonic: must be 12 or 24 words');
    }
    
    // Validate mnemonic using BIP39
    if (!bip39.validateMnemonic(cleanedMnemonic)) {
      throw new Error('Invalid mnemonic: checksum failed');
    }
    
    // Create account from mnemonic using Aptos SDK
    const account = Account.fromDerivationPath({
      path: "m/44'/637'/0'/0'/0'",
      mnemonic: cleanedMnemonic,
    });
    
    const privateKey = account.privateKey.toString();
    const publicKey = account.publicKey.toString();
    const address = account.accountAddress.toString();
    
    return {
      address,
      mnemonic: cleanedMnemonic,
      privateKey,
      publicKey
    };
  } catch (error) {
    console.error('Error importing wallet from mnemonic:', error);
    if (error instanceof Error) {
      throw error; // Re-throw with original message
    }
    throw new Error('Failed to import wallet from mnemonic');
  }
};

/**
 * Import wallet from private key using Aptos SDK
 */
export const importWalletFromPrivateKey = async (privateKey: string): Promise<AptosWalletData> => {
  try {
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      throw new Error('Invalid private key format');
    }
    
    // Create Ed25519PrivateKey from hex string
    const ed25519PrivateKey = new Ed25519PrivateKey(privateKey);
    
    // Create account from private key
    const account = Account.fromPrivateKey({ privateKey: ed25519PrivateKey });
    
    const publicKey = account.publicKey.toString();
    const address = account.accountAddress.toString();
    
    return {
      address,
      mnemonic: '', // Not available when importing from private key
      privateKey,
      publicKey
    };
  } catch (error) {
    console.error('Error importing wallet from private key:', error);
    throw new Error('Failed to import wallet from private key');
  }
};

/**
 * Get wallet balance from Aptos testnet
 */
export const getWalletBalance = async (address: string): Promise<string> => {
  try {
    const accountAddress = AccountAddress.fromString(address);
    const balance = await aptos.getAccountAPTAmount({
      accountAddress
    });
    
    // Convert from octas to APT (1 APT = 100,000,000 octas)
    const aptBalance = (balance / 100_000_000).toFixed(8);
    return aptBalance;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    // Return 0 if account doesn't exist or other error
    return '0.00000000';
  }
};

/**
 * Send APT transaction on Aptos testnet
 */
export const sendAptosTransaction = async (
  from: string,
  to: string,
  amount: string,
  privateKey: string
): Promise<TransactionResult> => {
  try {
    // Create sender account from private key
    const ed25519PrivateKey = new Ed25519PrivateKey(privateKey);
    const senderAccount = Account.fromPrivateKey({ privateKey: ed25519PrivateKey });
    
    // Validate addresses
    const senderAddress = AccountAddress.fromString(from);
    const recipientAddress = AccountAddress.fromString(to);
    
    // Convert amount to octas (1 APT = 100,000,000 octas)
    const amountInOctas = Math.floor(parseFloat(amount) * 100_000_000);
    
    if (amountInOctas <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    // Create the transaction
    const transaction = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipientAddress, amountInOctas],
      },
    });
    
    // Sign and submit the transaction
    const senderAuthenticator = aptos.transaction.sign({
      signer: senderAccount,
      transaction,
    });
    
    const committedTransaction = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });
    
    // Wait for transaction confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTransaction.hash,
    });
    
    return {
      hash: executedTransaction.hash,
      success: executedTransaction.success,
      gasUsed: parseInt(executedTransaction.gas_used || '0'),
      message: executedTransaction.success ? 'Transaction successful' : 'Transaction failed'
    };
    
  } catch (error) {
    console.error('Error sending Aptos transaction:', error);
    return {
      hash: '',
      success: false,
      gasUsed: 0,
      message: error instanceof Error ? error.message : 'Transaction failed'
    };
  }
};

/**
 * Fund account with devnet APT tokens (faucet)
 */
export const fundAccountWithDevnetAPT = async (address: string): Promise<boolean> => {
  try {
    const accountAddress = AccountAddress.fromString(address);
    await aptos.fundAccount({
      accountAddress,
      amount: 100_000_000, // 1 APT in octas
    });
    
    console.log(`Funded account ${address} with 1 APT from devnet faucet`);
    return true;
  } catch (error) {
    console.error('Error funding account:', error);
    return false;
  }
};

/**
 * Check if account exists on Aptos devnet
 */
export const checkAccountExists = async (address: string): Promise<boolean> => {
  try {
    const accountAddress = AccountAddress.fromString(address);
    const accountData = await aptos.getAccountInfo({
      accountAddress
    });
    return !!accountData;
  } catch (error) {
    console.error('Account does not exist or error checking:', error);
    return false;
  }
};

/**
 * Get account information from Aptos testnet
 */
export const getAccountInfo = async (address: string) => {
  try {
    const accountAddress = AccountAddress.fromString(address);
    const accountInfo = await aptos.getAccountInfo({
      accountAddress
    });
    return accountInfo;
  } catch (error) {
    console.error('Error getting account info:', error);
    throw error;
  }
};

/**
 * Validate BIP39 mnemonic phrase
 */
export const isValidMnemonic = (mnemonic: string): boolean => {
  try {
    const cleanedMnemonic = mnemonic.trim().toLowerCase();
    return bip39.validateMnemonic(cleanedMnemonic);
  } catch {
    return false;
  }
};

/**
 * Validate Aptos address format
 */
export const isValidAptosAddress = (address: string): boolean => {
  try {
    AccountAddress.fromString(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Format address for display (show first 6 and last 4 characters)
 */
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Encrypt wallet data with password
 * In production, use proper encryption libraries like crypto-js or Web Crypto API
 */
export const encryptWalletData = async (walletData: AptosWalletData, password: string): Promise<string> => {
  // Mock implementation - in production, use proper encryption
  const dataToEncrypt = JSON.stringify(walletData);
  const encrypted = btoa(dataToEncrypt); // Base64 encoding for demo
  return encrypted;
};

/**
 * Decrypt wallet data with password
 * In production, use proper decryption to match encryptWalletData
 */
export const decryptWalletData = async (encryptedData: string, password: string): Promise<AptosWalletData> => {
  try {
    // Mock implementation - in production, use proper decryption
    const decrypted = atob(encryptedData); // Base64 decoding for demo
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt wallet data - incorrect password');
  }
};



export default {
  generateAptosWallet,
  importWalletFromMnemonic,
  importWalletFromPrivateKey,
  getWalletBalance,
  sendAptosTransaction,
  fundAccountWithDevnetAPT,
  checkAccountExists,
  getAccountInfo,
  isValidMnemonic,
  isValidAptosAddress,
  formatAddress,
  encryptWalletData,
  decryptWalletData,
  aptos
};