import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertTriangle, ArrowUpRight, X, IndianRupee } from 'lucide-react';

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
      <DialogContent className="max-w-sm bg-black/95 backdrop-blur-md border border-gray-800 shadow-2xl">
        <div className="absolute right-4 top-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-800/50 rounded-full text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="pt-6 pb-2">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-black" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center mb-2 text-white">Send APT</h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            Send Aptos tokens instantly
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-950 border-red-800 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Recipient address (0x...)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="font-mono text-sm h-12 bg-gray-900 border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-gray-600"
              />
            </div>

            <div className="relative">
              <Input
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 text-lg pl-4 pr-16 bg-gray-900 border-gray-700 rounded-lg text-center text-white placeholder:text-gray-500 focus:border-gray-600"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <span className="text-sm font-medium text-black bg-white px-2 py-1 rounded">
                  APT
                </span>
              </div>
              {amount && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {estimatedFiat}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Input
                type="text"
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-10 bg-gray-900 border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-gray-600"
              />
            </div>

            {amount && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-medium text-white">{amount} APT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Network fee</span>
                  <span className="font-medium text-white">{estimatedFee}</span>
                </div>
                <div className="border-t border-gray-800 pt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-300">Total</span>
                    <span className="text-white">{amount ? (parseFloat(amount) + 0.001).toFixed(6) : '0.001'} APT</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSend}
              className="w-full h-12 bg-white hover:bg-gray-200 text-black font-medium rounded-lg transition-all duration-200 mt-6"
              disabled={isLoading || !recipient || !amount}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                'Send APT'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};