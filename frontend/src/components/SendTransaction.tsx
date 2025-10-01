import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Send, AlertTriangle, X, IndianRupee } from 'lucide-react';
import { getAccountBalance } from '@/utils/walletUtils';

interface SendTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendTransaction: React.FC<SendTransactionProps> = ({ isOpen, onClose, onSuccess }) => {
  const [recipient, setRecipient] = useState('');
  const [inrAmount, setInrAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentBalance, setCurrentBalance] = useState('0');
  const { toast } = useToast();

  const currentRate = 373;
  const aptAmount = inrAmount && !isNaN(parseFloat(inrAmount)) ? (parseFloat(inrAmount) / currentRate).toFixed(8) : '0';

  useEffect(() => {
    const loadBalance = async () => {
      if (isOpen) {
        try {
          const walletData = localStorage.getItem('cryptal_wallet');
          if (walletData) {
            const parsedWalletData = JSON.parse(walletData);
            const currentIndex = parsedWalletData.currentAccountIndex || 0;
            const currentAccount = parsedWalletData.accounts?.[currentIndex];
            if (currentAccount) {
              const balance = await getAccountBalance(currentAccount.address);
              setCurrentBalance(balance);
            }
          }
        } catch (error) {
          console.error('Error loading balance:', error);
        }
      }
    };
    loadBalance();
  }, [isOpen]);

  const handleSend = async () => {
    if (!recipient || !inrAmount) {
      setError('Please fill in recipient address and amount');
      return;
    }

    const transactionAptAmount = parseFloat(aptAmount);
    if (transactionAptAmount <= 0 || isNaN(transactionAptAmount)) {
      setError('Invalid amount');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const walletData = localStorage.getItem('cryptal_wallet');
      if (!walletData) throw new Error('Wallet not found');

      const parsedWalletData = JSON.parse(walletData);
      const currentIndex = parsedWalletData.currentAccountIndex || 0;
      const currentAccount = parsedWalletData.accounts?.[currentIndex];
      
      if (!currentAccount) throw new Error('Account not found');

      const senderBalance = parseFloat(await getAccountBalance(currentAccount.address));
      
      if (senderBalance < transactionAptAmount) {
        throw new Error(`Insufficient balance. Available: ${senderBalance} APT, Required: ${transactionAptAmount} APT`);
      }

      throw new Error('Real blockchain transactions not yet implemented');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setInrAmount('');
    setNote('');
    setError('');
    onClose();
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
          {error && (
            <Alert className="bg-red-900/50 border-red-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-400">Your Balance</p>
            <p className="text-2xl font-bold text-white">{currentBalance} APT</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-300">Recipient Address</Label>
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x1234..."
              className="bg-gray-900 border-gray-700 text-white font-mono text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-300 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Amount (INR)
            </Label>
            <Input
              type="number"
              value={inrAmount}
              onChange={(e) => setInrAmount(e.target.value)}
              placeholder="0.00"
              className="bg-gray-900 border-gray-700 text-white"
              disabled={isLoading}
            />
            {inrAmount && <p className="text-xs text-gray-400"> {aptAmount} APT</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-300">Note (Optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="bg-gray-900 border-gray-700 text-white"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={isLoading || !recipient || !inrAmount}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Sending...' : 'Send Transaction'}
          </Button>

          <div className="text-center text-xs text-yellow-500">
             Real blockchain transactions coming soon
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
