import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Copy, ArrowDownLeft, X, Shield, Check, Download } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { getAccountBalance } from '@/utils/walletUtils';

interface ReceiveTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

const AddressQRCode: React.FC<{ address: string; canvasRef: React.RefObject<HTMLCanvasElement> }> = ({ address, canvasRef }) => {
  useEffect(() => {
    if (address && canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, address, {
        width: 160,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [address, canvasRef]);

  return (
    <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center border border-gray-700 p-2">
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
};

export const ReceiveTransaction: React.FC<ReceiveTransactionProps> = ({ 
  isOpen, 
  onClose, 
  address 
}) => {
  const [copied, setCopied] = useState(false);
  const [currentBalance, setCurrentBalance] = useState('0');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Load current balance
  useEffect(() => {
    const loadBalance = async () => {
      if (address) {
        const balance = await getAccountBalance(address);
        setCurrentBalance(balance);
      }
    };
    loadBalance();
  }, [address]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Address Copied!",
        description: "Wallet address copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQRCode = () => {
    if (qrCanvasRef.current) {
      const canvas = qrCanvasRef.current;
      const link = document.createElement('a');
      link.download = `wallet-address-qr-${address.slice(0, 8)}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "QR Code Downloaded",
        description: "Your wallet address QR code has been saved successfully.",
        duration: 3000,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-md border border-gray-800 shadow-2xl">
        <div className="pt-4 pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center mb-2 text-white">Receive APT</h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            Current Balance: <span className="text-green-500 font-semibold">{currentBalance} APT</span>
          </p>

          <div className="space-y-4">
              {/* QR Code Section */}
              <div className="flex justify-center">
                <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
                  <AddressQRCode address={address} canvasRef={qrCanvasRef} />
                </div>
              </div>

              {/* Address Display */}
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Your Address
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                    <div className="font-mono text-xs text-white break-all text-center">
                      {address}
                    </div>
                  </div>
                </div>

                {/* Network Badge */}
                <div className="flex justify-center">
                  <div className="bg-gray-800 border border-gray-700 rounded-full px-3 py-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-300">Aptos Network</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => copyToClipboard(address)}
                    className="h-10 bg-white hover:bg-gray-200 text-black font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    {copied ? (
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Copied!
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        Copy
                      </div>
                    )}
                  </Button>

                  <Button 
                    onClick={downloadQRCode}
                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      QR Code
                    </div>
                  </Button>
                </div>

                {/* Security Notice */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
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