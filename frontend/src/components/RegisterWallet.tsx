import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '../contexts/WalletContext';

interface RegisterWalletProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegisterWallet: React.FC<RegisterWalletProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { registerWalletId, isConnected, address } = useWallet();
  const [walletId, setWalletId] = useState('');
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
    if (!walletId.trim()) {
      setError('Please enter a wallet ID');
      return;
    }

    if (walletId.length < 3 || walletId.length > 50) {
      setError('Wallet ID must be between 3 and 50 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_@.-]+$/.test(walletId)) {
      setError('Wallet ID can only contain letters, numbers, @, ., -, and _');
      return;
    }

    setIsLoading(true);

    try {
      const transactionHash = await registerWalletId(walletId);
      setTxHash(transactionHash);
      setSuccess(true);
      
      // Reset form after a delay and call onSuccess
      setTimeout(() => {
        setWalletId('');
        setSuccess(false);
        setTxHash('');
        setIsLoading(false);
        onSuccess?.();
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to register wallet ID');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setWalletId('');
      setError('');
      setSuccess(false);
      setTxHash('');
      onClose();
    }
  };

  const generateSuggestion = () => {
    if (address) {
      // Generate a suggestion based on address
      const shortAddress = address.slice(-8);
      setWalletId(`wallet_${shortAddress}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-black/95 backdrop-blur-sm border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            Register Wallet ID
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Register a unique wallet ID to receive payment requests from others
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <Alert className="bg-red-500/10 border-red-500/20 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/10 border-green-500/20 text-green-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <AlertDescription className="font-medium">
                    Wallet ID registered successfully!
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

          {/* Wallet ID Field */}
          <div className="space-y-2">
            <Label htmlFor="walletId" className="text-white flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet ID
            </Label>
            <div className="flex gap-2">
              <Input
                id="walletId"
                type="text"
                placeholder="e.g., john123, @myWallet, user.main"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value.toLowerCase())}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-white/50 flex-1"
                disabled={isLoading || success}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSuggestion}
                disabled={isLoading || success}
                className="bg-transparent border-gray-600 text-white hover:bg-gray-800/50 whitespace-nowrap"
              >
                Auto
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Choose a unique ID that others can use to send you payment requests. 
              Must be 3-50 characters, using letters, numbers, @, ., -, or _.
            </p>
          </div>

          {/* Current Address Display */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Current Address</Label>
            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 font-mono break-all">
                {address || 'Not connected'}
              </p>
            </div>
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
              disabled={isLoading || success}
              className="flex-1 bg-white hover:bg-gray-100 text-black font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Registered!
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Register ID
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300 leading-relaxed">
            <strong>Note:</strong> Once registered, others can send payment requests to your wallet ID 
            instead of using your long address. This makes transactions easier and more user-friendly.
            You need to register a wallet ID before you can receive payment requests.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};