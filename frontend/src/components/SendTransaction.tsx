import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertTriangle, DollarSign } from 'lucide-react';

interface SendTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendTransaction: React.FC<SendTransactionProps> = ({ isOpen, onClose }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!recipient || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Mock transaction - replace with actual wallet send logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form
      setRecipient('');
      setAmount('');
      setNote('');
      onClose();
    } catch (err) {
      setError('Transaction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedFee = '0.001 APT';
  const estimatedFiat = amount ? `≈ ₹${(parseFloat(amount) * 251100).toFixed(2)}` : '₹0.00';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send APT
          </DialogTitle>
          <DialogDescription>
            Send Aptos to another wallet address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address *</Label>
            <Input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (APT) *</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                APT
              </div>
            </div>
            {amount && (
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {estimatedFiat}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              type="text"
              placeholder="Payment for..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Transaction Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-gray-700">Transaction Summary</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{amount || '0'} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network Fee:</span>
                <span className="font-medium">{estimatedFee}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1">
                <span className="text-gray-700 font-medium">Total:</span>
                <span className="font-bold">{amount ? (parseFloat(amount) + 0.001).toFixed(6) : '0.001'} APT</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1"
              disabled={isLoading || !recipient || !amount}
            >
              {isLoading ? 'Sending...' : 'Send APT'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};