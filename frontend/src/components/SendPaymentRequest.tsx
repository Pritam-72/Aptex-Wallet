import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, User, DollarSign, MessageSquare, X, AlertCircle, Loader2, CheckCircle2, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  resolveRecipient,
  getAccountFromPrivateKey,
  aptToOctas,
  createPaymentRequest,
  getWalletIdByAddress,
  aptos
} from '@/utils/contractUtils';

interface SendPaymentRequestProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
}

export const SendPaymentRequest: React.FC<SendPaymentRequestProps> = ({
  isOpen,
  onClose,
  userAddress
}) => {
  const [recipient, setRecipient] = useState('');
  const [aptAmount, setAptAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingRecipient, setIsResolvingRecipient] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [recipientType, setRecipientType] = useState<'address' | 'walletId' | 'upiId' | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const { toast } = useToast();

  // Resolve recipient (address/wallet ID/UPI ID)
  useEffect(() => {
    if (!recipient.trim() || success) return;

    const timeoutId = setTimeout(async () => {
      setIsResolvingRecipient(true);
      setError('');
      try {
        const result = await resolveRecipient(recipient);
        setResolvedAddress(result.address);
        setRecipientType(result.type);
        setError('');
      } catch (err) {
        setResolvedAddress(null);
        setRecipientType(null);
        if (recipient.length > 5) {
          setError(err instanceof Error ? err.message : 'Invalid recipient');
        }
      } finally {
        setIsResolvingRecipient(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [recipient, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Validation
      if (!recipient.trim()) {
        setError('Please enter a recipient (address, wallet ID, or UPI ID)');
        setIsSubmitting(false);
        return;
      }

      if (!aptAmount.trim() || parseFloat(aptAmount) <= 0) {
        setError('Please enter a valid amount');
        setIsSubmitting(false);
        return;
      }

      // Ensure recipient is resolved
      let finalRecipientAddress = resolvedAddress;
      let finalRecipientType = recipientType;
      
      if (!finalRecipientAddress) {
        const result = await resolveRecipient(recipient);
        finalRecipientAddress = result.address;
        finalRecipientType = result.type;
      }

      if (!finalRecipientAddress) {
        setError('Recipient not found. Please ensure they have registered their wallet ID.');
        setIsSubmitting(false);
        return;
      }

      if (finalRecipientAddress === userAddress) {
        setError('You cannot send a payment request to yourself');
        setIsSubmitting(false);
        return;
      }

      // Get private key from localStorage (using correct storage key)
      const storedWallet = localStorage.getItem('cryptal_wallet');
      if (!storedWallet) {
        setError('Wallet not found. Please create or import a wallet first.');
        setIsSubmitting(false);
        return;
      }

      const walletData = JSON.parse(storedWallet);
      const currentIndex = walletData.currentAccountIndex || 0;
      const currentAccount = walletData.accounts?.[currentIndex];
      
      if (!currentAccount || !currentAccount.privateKey) {
        setError('Account not found. Please ensure your wallet is properly set up.');
        setIsSubmitting(false);
        return;
      }

      const account = getAccountFromPrivateKey(currentAccount.privateKey);

      // Convert APT to Octas (1 APT = 100,000,000 Octas)
      const amountInOctas = aptToOctas(parseFloat(aptAmount));

      // The contract requires wallet_id, so we need to get it
      let recipientWalletId: string;
      
      if (finalRecipientType === 'walletId') {
        // Already have wallet ID
        recipientWalletId = recipient;
      } else {
        // Need to get wallet ID from address
        const walletId = await getWalletIdByAddress(finalRecipientAddress);
        if (!walletId) {
          setError('Recipient has not registered a wallet ID. They must register before receiving payment requests.');
          setIsSubmitting(false);
          return;
        }
        recipientWalletId = walletId;
      }

      // Create payment request on-chain with wallet ID
      const result = await createPaymentRequest(
        account,
        recipientWalletId,
        amountInOctas,
        description || ''
      );

      // Check if transaction failed
      if (!result.success) {
        setError(result.error || 'Transaction failed');
        toast({
          title: "Request Failed",
          description: result.error || 'Transaction failed on blockchain',
          variant: "destructive",
          duration: 5000,
        });
        setIsSubmitting(false);
        return;
      }

      setTxHash(result.hash || '');
      setSuccess(true);

      toast({
        title: "Payment Request Sent!",
        description: `Request for ${aptAmount} APT sent successfully.`,
        duration: 5000,
      });

      // Close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating payment request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send payment request';
      setError(errorMessage);
      
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setAptAmount('');
    setDescription('');
    setError('');
    setSuccess(false);
    setResolvedAddress(null);
    setRecipientType(null);
    setTxHash('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-black/95 backdrop-blur-md border border-gray-800 shadow-2xl">
        <div className="absolute right-4 top-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-gray-800/50 rounded-full text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <DialogHeader className="pt-4">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-orange-600 rounded-full flex items-center justify-center">
              <Send className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-white">
            Send Payment Request
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Request money from another wallet
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          {success && (
            <Alert className="bg-green-900/50 border-green-700">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                <div>Payment request sent successfully!</div>
                {txHash && (
                  <div className="text-xs mt-1 break-all">
                    TX: {txHash.slice(0, 20)}...{txHash.slice(-20)}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {error && !success && (
            <Alert className="bg-red-900/50 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-300">
                {error}
                {error.includes('wallet ID') && (
                  <div className="text-xs mt-2 text-red-200">
                    💡 Tip: Both you and the recipient must register a Wallet ID in Settings → Profile before sending payment requests.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <User className="h-4 w-4" />
              Recipient
              {recipientType && (
                <Badge variant="outline" className="text-xs ml-2">
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
              id="recipient"
              type="text"
              placeholder="Address, Wallet ID, or UPI ID..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 text-sm"
              required
              disabled={isSubmitting || success}
            />
            {isResolvingRecipient && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Resolving recipient...
              </p>
            )}
            <p className="text-xs text-gray-500">
              Enter wallet address (0x...), Wallet ID (@username), or UPI ID (name@provider)
            </p>
            {resolvedAddress && !isResolvingRecipient && (
              <div className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Recipient found: {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Amount (APT)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              placeholder="0.00000000"
              value={aptAmount}
              onChange={(e) => setAptAmount(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
              required
              disabled={isSubmitting || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="What's this request for? (e.g., Dinner bill split, Movie tickets...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 min-h-[80px] resize-none"
              disabled={isSubmitting}
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Add a note to help them understand what this request is for
              </p>
              <span className="text-xs text-gray-500">{description.length}/200</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {success ? 'Close' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || success || isResolvingRecipient}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Request...
                </div>
              ) : success ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Request Sent!
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Request
                </div>
              )}
            </Button>
          </div>

          {!success && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400">
                ✓ On-chain payment request | ✓ Auto-detect: Address / Wallet ID / UPI ID
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};