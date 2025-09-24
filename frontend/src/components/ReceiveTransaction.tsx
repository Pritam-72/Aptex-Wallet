import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, ArrowDownLeft, X, Shield, Check } from 'lucide-react';

interface ReceiveTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

const AddressQRCode: React.FC<{ address: string }> = ({ address }) => {
  // Mock QR code component - replace with actual QR code library
  return (
    <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center border border-gray-700">
      <QrCode className="h-16 w-16 text-black" />
    </div>
  );
};

export const ReceiveTransaction: React.FC<ReceiveTransactionProps> = ({ 
  isOpen, 
  onClose, 
  address 
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncatedAddress = address ? 
    `${address.slice(0, 6)}...${address.slice(-4)}` : '';

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
              <ArrowDownLeft className="h-6 w-6 text-black" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center mb-2 text-white">Receive APT</h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            Share this address to receive payments
          </p>

          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="flex justify-center">
              <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
                <AddressQRCode address={address} />
              </div>
            </div>

            {/* Address Display */}
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Your Wallet Address
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="font-mono text-sm text-white break-all text-center">
                    {address}
                  </div>
                </div>
              </div>

              {/* Network Badge */}
              <div className="flex justify-center">
                <div className="bg-gray-800 border border-gray-700 rounded-full px-3 py-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-xs font-medium text-gray-300">Aptos Network</span>
                </div>
              </div>

              {/* Copy Button */}
              <Button 
                onClick={() => copyToClipboard(address)}
                className="w-full h-12 bg-white hover:bg-gray-200 text-black font-medium rounded-lg transition-all duration-200"
              >
                {copied ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Copied!
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Copy Address
                  </div>
                )}
              </Button>

              {/* Security Notice */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-gray-300 mb-1">
                      Security Notice
                    </div>
                    <div className="text-xs text-gray-400">
                      Only send APT and Aptos tokens to this address. Always verify the network.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};