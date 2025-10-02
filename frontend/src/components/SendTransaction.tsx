import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, AlertTriangle, X, IndianRupee, Loader2, CheckCircle2, Fuel, User, CreditCard } from 'lucide-react';
import { getAccountBalance } from '@/utils/walletUtils';
import {
  resolveRecipient,
  getAccountFromPrivateKey,
  aptToOctas,
  octasToApt,
  checkSufficientBalance,
  estimateGas,
  aptos,
  transferWithTracking
} from '@/utils/contractUtils';
import { getToastErrorMessage } from '@/utils/errorHandler';
import { ContractErrorDisplay } from './ContractErrorDisplay';
import { rpcCache, generateCacheKey } from '@/utils/rpcCache';

interface SendTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendTransaction: React.FC<SendTransactionProps> = ({ isOpen, onClose, onSuccess }) => {
  const [recipient, setRecipient] = useState('');
  const [aptAmount, setAptAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResolvingRecipient, setIsResolvingRecipient] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [currentBalance, setCurrentBalance] = useState('0');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [recipientType, setRecipientType] = useState<'address' | 'walletId' | 'upiId' | null>(null);
  const [gasEstimate, setGasEstimate] = useState('0.0002');
  const [txHash, setTxHash] = useState('');
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  // Get current account
  const getCurrentAccount = () => {
    try {
      const walletData = localStorage.getItem('cryptal_wallet');
      if (walletData) {
        const parsedWalletData = JSON.parse(walletData);
        const currentIndex = parsedWalletData.currentAccountIndex || 0;
        return parsedWalletData.accounts?.[currentIndex] || null;
      }
    } catch (error) {
      console.error('Error getting current account:', error);
    }
    return null;
  };

  const currentAccount = getCurrentAccount();
  const currentAddress = currentAccount?.address || null;

  // Load balance when dialog opens
  useEffect(() => {
    const loadBalance = async () => {
      if (isOpen && currentAddress) {
        try {
          const balance = await getAccountBalance(currentAddress);
          setCurrentBalance(balance);
        } catch (error) {
          console.error('Error loading balance:', error);
        }
      }
    };
    loadBalance();
  }, [isOpen, currentAddress]);

  // Auto-resolve recipient when input changes
  useEffect(() => {
    const resolveRecipientAddress = async () => {
      if (!recipient.trim()) {
        setResolvedAddress(null);
        setRecipientType(null);
        setWarning('');
        return;
      }

      setIsResolvingRecipient(true);
      setWarning('');
      
      try {
        const result = await resolveRecipient(recipient.trim());
        
        if (result.address) {
          setResolvedAddress(result.address);
          setRecipientType(result.type);
          
          if (result.type === 'walletId') {
            setWarning(`✓ Resolved Wallet ID to: ${result.address.slice(0, 10)}...${result.address.slice(-8)}`);
          } else if (result.type === 'upiId') {
            setWarning(`✓ Resolved UPI ID to: ${result.address.slice(0, 10)}...${result.address.slice(-8)}`);
          }
        } else {
          setResolvedAddress(null);
          setRecipientType(null);
          if (result.type === 'walletId') {
            setWarning('⚠ Wallet ID not found');
          } else if (result.type === 'upiId') {
            setWarning('⚠ UPI ID not registered');
          } else {
            setWarning('⚠ Invalid recipient address');
          }
        }
      } catch (error) {
        console.error('Error resolving recipient:', error);
        setResolvedAddress(null);
        setRecipientType(null);
      } finally {
        setIsResolvingRecipient(false);
      }
    };

    const debounceTimer = setTimeout(resolveRecipientAddress, 500);
    return () => clearTimeout(debounceTimer);
  }, [recipient]);

  // Check balance when amount changes
  useEffect(() => {
    const checkBalance = async () => {
      if (!aptAmount || !currentAddress) return;

      const amount = parseFloat(aptAmount);
      if (isNaN(amount) || amount <= 0) return;

      try {
        const gasEstimateAPT = parseFloat(gasEstimate);
        const balanceCheck = await checkSufficientBalance(currentAddress, amount, gasEstimateAPT);
        
        if (!balanceCheck.sufficient) {
          setWarning(`⚠ Insufficient balance! You need ${balanceCheck.required.toFixed(8)} APT (including gas) but only have ${balanceCheck.currentBalance.toFixed(8)} APT`);
        } else if (balanceCheck.currentBalance - balanceCheck.required < 0.01) {
          setWarning(`⚠ Low balance warning! After this transaction you'll have only ${(balanceCheck.currentBalance - balanceCheck.required).toFixed(8)} APT left`);
        }
      } catch (error) {
        console.error('Error checking balance:', error);
      }
    };

    checkBalance();
  }, [aptAmount, currentAddress, gasEstimate]);

  const handleSend = async () => {
    setError('');
    setWarning('');

    // Validation
    if (!recipient.trim()) {
      setError('Please enter recipient address, Wallet ID, or UPI ID');
      return;
    }

    if (!aptAmount.trim()) {
      setError('Please enter amount to send');
      return;
    }

    const amount = parseFloat(aptAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!currentAccount || !currentAddress) {
      setError('Wallet not connected');
      return;
    }

    // Check if recipient is resolved (for wallet ID / UPI ID)
    let finalRecipientAddress = recipient.trim();
    if (recipientType === 'walletId' || recipientType === 'upiId') {
      if (!resolvedAddress) {
        setError(`${recipientType === 'walletId' ? 'Wallet ID' : 'UPI ID'} not found. Please check and try again.`);
        return;
      }
      finalRecipientAddress = resolvedAddress;
    }

    // Validate address format
    if (!finalRecipientAddress.startsWith('0x') || finalRecipientAddress.length !== 66) {
      setError('Invalid recipient address format');
      return;
    }

    setIsLoading(true);

    try {
      // Check sufficient balance
      const gasEstimateAPT = parseFloat(gasEstimate);
      const balanceCheck = await checkSufficientBalance(currentAddress, amount, gasEstimateAPT);
      
      if (!balanceCheck.sufficient) {
        throw new Error(`Insufficient balance. You need ${balanceCheck.required.toFixed(8)} APT (including gas) but only have ${balanceCheck.currentBalance.toFixed(8)} APT`);
      }

      // Get account from private key
      const account = getAccountFromPrivateKey(currentAccount.privateKey);
      
      // Use contract's transfer_with_tracking function to enable loyalty NFT minting
      const result = await transferWithTracking(account, finalRecipientAddress, amount);

      if (result.success && result.hash) {
        setTxHash(result.hash);
        setSuccess(true);

        toast({
          title: "Transaction Successful! 🎉",
          description: `Sent ${amount} APT to ${recipientType === 'address' ? 'address' : recipientType === 'walletId' ? 'Wallet ID' : 'UPI ID'}. Loyalty NFT will be minted if eligible!`,
          duration: 5000,
        });

        // Invalidate user stats cache so loyalty NFT can refresh with new transaction count
        rpcCache.invalidate(generateCacheKey('getUserStats', currentAddress));
        console.log('🔄 Invalidated user stats cache after transaction');
        console.log('✨ Transaction tracked! Check for loyalty NFT minting...');

        // Refresh balance
        const newBalance = await getAccountBalance(currentAddress);
        setCurrentBalance(newBalance);

        // Reset form and close after delay
        setTimeout(() => {
          handleClose();
          onSuccess?.();
        }, 3000);
      } else {
        throw new Error('Transaction failed: ' + (result.error || 'Unknown error'));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      
      // Use enhanced error handling for toast
      const { title, description } = getToastErrorMessage(err);
      toast({
        title,
        description,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setRecipient('');
      setAptAmount('');
      setNote('');
      setError('');
      setWarning('');
      setSuccess(false);
      setTxHash('');
      setResolvedAddress(null);
      setRecipientType(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-black/95 backdrop-blur-md border border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute right-4 top-4 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>

        <DialogHeader className="pt-4">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Send className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl text-center text-white">Send Transaction</DialogTitle>
          <DialogDescription className="text-center text-gray-400">Send APT to another wallet</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          {success && (
            <Alert className="bg-green-900/50 border-green-700">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                <div>Transaction successful!</div>
                {txHash && (
                  <div className="text-xs mt-1 break-all">
                    Hash: {txHash.slice(0, 20)}...{txHash.slice(-20)}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <ContractErrorDisplay
              error={error}
              onDismiss={() => setError('')}
              className="mb-2"
            />
          )}

          {warning && !error && (
            <Alert className="bg-yellow-900/50 border-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-300">{warning}</AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-400">Your Balance</p>
            <p className="text-2xl font-bold text-white">{currentBalance} APT</p>
            <div className="flex items-center gap-2 mt-2">
              <Fuel className="h-3 w-3 text-gray-500" />
              <p className="text-xs text-gray-500">Est. Gas: ~{gasEstimate} APT</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-300 flex items-center gap-2">
              Recipient
              {recipientType && (
                <Badge variant="outline" className="text-xs">
                  {recipientType === 'walletId' ? (
                    <><User className="h-3 w-3 mr-1" />Wallet ID</>
                  ) : recipientType === 'upiId' ? (
                    <><CreditCard className="h-3 w-3 mr-1" />UPI ID</>
                  ) : (
                    'Address'
                  )}
                </Badge>
              )}
            </Label>
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Address, Wallet ID, or UPI ID..."
              className="bg-gray-900 border-gray-700 text-white text-sm"
              disabled={isLoading || success}
            />
            {isResolvingRecipient && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Resolving...
              </p>
            )}
            <p className="text-xs text-gray-400">
              Enter wallet address (0x...), Wallet ID (@username), or UPI ID (name@provider)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-300">Amount (APT)</Label>
            <Input
              type="number"
              step="0.00000001"
              value={aptAmount}
              onChange={(e) => setAptAmount(e.target.value)}
              placeholder="0.00000000"
              className="bg-gray-900 border-gray-700 text-white"
              disabled={isLoading || success}
            />
            <p className="text-xs text-gray-400">
              Available: {currentBalance} APT
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-300">Note (Optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="bg-gray-900 border-gray-700 text-white"
              disabled={isLoading || success}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={isLoading || success || !recipient || !aptAmount || isResolvingRecipient}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Transaction...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Transaction Sent!
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Transaction
              </>
            )}
          </Button>

          {!success && (
            <div className="text-center text-xs text-gray-500">
              <p>✓ Real blockchain transactions enabled</p>
              <p className="mt-1">✓ Auto-detect: Address / Wallet ID / UPI ID</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
