import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, AlertTriangle, Key, Database } from 'lucide-react';

interface WalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupNew: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ isOpen, onClose, onSetupNew }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Mock wallet connection - replace with actual wallet connection logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      onClose();
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to access your wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Connect Existing Wallet */}
          <div className="space-y-3">
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full h-12 justify-start gap-3"
              variant="outline"
            >
              <Key className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Connect Existing Wallet</div>
                <div className="text-xs text-gray-500">Use your saved wallet</div>
              </div>
            </Button>

            <Button
              onClick={onSetupNew}
              className="w-full h-12 justify-start gap-3"
              variant="outline"
            >
              <Database className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Create New Wallet</div>
                <div className="text-xs text-gray-500">Generate a new secure wallet</div>
              </div>
            </Button>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Wallet className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-900">Secure Connection</div>
                <div className="text-xs text-blue-700 mt-1">
                  Your wallet data is encrypted and stored securely. We never have access to your private keys.
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};