import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HandCoins, User, DollarSign, MessageSquare, QrCode, Copy, Share, X, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import QRCodeLib from 'qrcode';

interface RequestMoneyProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
}

export const RequestMoney: React.FC<RequestMoneyProps> = ({
  isOpen,
  onClose,
  userAddress
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Generate QR code when payment request is created
  useEffect(() => {
    if (paymentRequest && qrCanvasRef.current) {
      QRCodeLib.toCanvas(qrCanvasRef.current, paymentRequest.qrData, {
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
  }, [paymentRequest]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('Payment request feature coming soon - requires backend implementation');
    
    toast({
      title: "Feature Coming Soon",
      description: "Payment requests require backend/smart contract implementation",
      variant: "destructive",
      duration: 3000,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Payment Request Copied!",
        description: "Payment request link copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (paymentRequest) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Payment Request',
            text: `Payment request for ${amount} APT${description ? ` - ${description}` : ''}`,
            url: paymentRequest.qrData
          });
        } catch (err) {
          console.error('Error sharing:', err);
          copyToClipboard(paymentRequest.qrData);
        }
      } else {
        copyToClipboard(paymentRequest.qrData);
      }
    }
  };

  const handleReset = () => {
    setAmount('');
    setDescription('');
    setError('');
    setPaymentRequest(null);
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
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
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <HandCoins className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-white">
            Request Payment
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Create a payment request to share with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          {!paymentRequest ? (
            // Payment Request Form
            <form onSubmit={handleCreateRequest} className="space-y-4">
              {error && (
                <Alert className="bg-red-900/50 border-red-700">
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount (APT)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="Enter amount to request..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="What's this payment for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 min-h-[80px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                <HandCoins className="h-4 w-4 mr-2" />
                Create Payment Request
              </Button>
            </form>
          ) : (
            // Payment Request Display
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-3">Payment Request Created</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Amount:</span>
                    <span className="text-sm font-semibold text-white">{amount} APT</span>
                  </div>
                  
                  {description && (
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-400">Note:</span>
                      <span className="text-sm text-white text-right max-w-[200px]">{description}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-400">To Address:</span>
                    <span className="text-xs font-mono text-white text-right max-w-[200px] break-all">
                      {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl">
                  <canvas ref={qrCanvasRef} className="max-w-full max-h-full" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => copyToClipboard(paymentRequest.qrData)}
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
                      Copy Link
                    </div>
                  )}
                </Button>

                <Button
                  onClick={handleShare}
                  className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                >
                  <div className="flex items-center gap-1">
                    <Share className="h-3 w-3" />
                    Share
                  </div>
                </Button>
              </div>

              {/* Create New Request */}
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full h-10 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200"
              >
                Create New Request
              </Button>

              {/* Info */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">
                  💡 Share this QR code or link with the person you want to request payment from. 
                  They can scan it or click the link to send you the requested amount.
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};