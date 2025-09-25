import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HandCoins, Loader2, User, DollarSign, MessageSquare, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '../contexts/WalletContext';
// import { formatAptosAddress } from '../services/aptosService';

interface RequestMoneyProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestMoney: React.FC<RequestMoneyProps> = ({
  isOpen,
  onClose
}) => {
  const { createPaymentRequest, isConnected } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Check wallet connection
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    // Validation
    if (!recipientAddress.trim()) {
      setError('Please enter a recipient address');
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for your request');
      return;
    }

    // Validate wallet ID or Aptos address format
    if (recipientAddress.startsWith('0x')) {
      // It's an address - validate hex format
      const addressWithoutPrefix = recipientAddress.slice(2);
      if (!/^[0-9a-fA-F]+$/.test(addressWithoutPrefix)) {
        setError('Please enter a valid Aptos address (only hexadecimal characters allowed)');
        return;
      }
      if (addressWithoutPrefix.length === 0 || addressWithoutPrefix.length > 64) {
        setError('Please enter a valid Aptos address');
        return;
      }
    } else {
      // It's a wallet ID - basic validation
      if (recipientAddress.length < 3 || recipientAddress.length > 50) {
        setError('Wallet ID must be between 3 and 50 characters');
        return;
      }
      if (!/^[a-zA-Z0-9_@.-]+$/.test(recipientAddress)) {
        setError('Wallet ID can only contain letters, numbers, @, ., -, and _');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Use the recipient identifier as-is (wallet ID or address)
      const recipientId = recipientAddress.startsWith('0x') 
        ? formatAptosAddress(recipientAddress) 
        : recipientAddress;
      const transactionHash = await createPaymentRequest(recipientId, amount, description);
      setTxHash(transactionHash);
      setSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setRecipientAddress('');
        setAmount('');
        setDescription('');
        setSuccess(false);
        setTxHash('');
        onClose();
      }, 3000);
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to send payment request';
      
      // Check if it's a wallet ID not found error
      if (errorMessage.includes('E_WALLET_ID_NOT_FOUND') || errorMessage.includes('WALLET_ID_NOT_FOUND')) {
        errorMessage = `Wallet ID "${recipientAddress}" not found. The recipient needs to register their wallet ID first, or try using their full Aptos address instead.`;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setRecipientAddress('');
      setAmount('');
      setDescription('');
      setError('');
      setSuccess(false);
      setTxHash('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-black/95 backdrop-blur-sm border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
              <HandCoins className="h-5 w-5 text-white" />
            </div>
            Request Money
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Send a payment request to another wallet address
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <Alert className="bg-red-500/10 border-red-500/20 text-red-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/10 border-green-500/20 text-green-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <AlertDescription className="font-medium">
                    Payment request sent successfully!
                  </AlertDescription>
                  {txHash && (
                    <p className="text-xs text-green-400 mt-1 break-all">
                      Transaction: {txHash}
                    </p>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* Recipient Address Field */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-white flex items-center gap-2">
              <User className="h-4 w-4" />
              Recipient Wallet ID
            </Label>
            <Input
              id="recipient"
              type="text"
              placeholder="wallet123 or 0x9c2fe13427bfa2d51671cdc2c04b4915ed4ef81709ccd8cd31c1150769596d2c"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-white/50"
              disabled={isLoading}
              autoComplete="off"
            />
            <p className="text-xs text-gray-400">
              Enter the wallet ID or Aptos address of the recipient
            </p>
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Amount (APT)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-white/50"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400">
              {amount && !isNaN(parseFloat(amount)) && (
                <>Approximately ₹{(parseFloat(amount) * 1000).toFixed(2)} INR</>
              )}
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="What is this payment request for? (e.g., Dinner split, Movie tickets, etc.)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-white/50 resize-none"
              rows={3}
              disabled={isLoading}
              maxLength={200}
            />
            <p className="text-xs text-gray-400">
              {description.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-white hover:bg-gray-100 text-black font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <HandCoins className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300 leading-relaxed">
            <strong>Note:</strong> This will create a payment request on the Aptos blockchain. 
            The recipient will be notified and can choose to pay or reject your request.
            No funds are transferred until they approve the payment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};