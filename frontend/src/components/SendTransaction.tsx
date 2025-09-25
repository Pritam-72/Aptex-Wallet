import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Send, AlertTriangle, ArrowUpRight, X, IndianRupee, QrCode, Upload, Camera } from 'lucide-react';
import { addTransactionToStorage } from '@/utils/transactionStorage';
import { updateBalancesAfterTransaction, getBalanceForAddress } from '@/utils/balanceStorage';
import { handleTransactionAndMintNFTs } from '@/utils/nftStorage';
import QrScanner from 'qr-scanner';

interface SendTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendTransaction: React.FC<SendTransactionProps> = ({ isOpen, onClose, onSuccess }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentBalance, setCurrentBalance] = useState('0');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  // Load current balance when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      try {
        const walletData = localStorage.getItem('cryptal_wallet');
        if (walletData) {
          const parsedWalletData = JSON.parse(walletData);
          const currentIndex = parsedWalletData.currentAccountIndex || 0;
          const currentAccount = parsedWalletData.accounts?.[currentIndex];
          if (currentAccount) {
            const balance = getBalanceForAddress(currentAccount.address);
            setCurrentBalance(balance);
          }
        }
      } catch (error) {
        console.error('Error loading balance:', error);
      }
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!recipient || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get current wallet data
      const walletData = localStorage.getItem('cryptal_wallet');
      if (!walletData) {
        throw new Error('Wallet not found');
      }

      const parsedWalletData = JSON.parse(walletData);
      const currentIndex = parsedWalletData.currentAccountIndex || 0;
      const currentAccount = parsedWalletData.accounts?.[currentIndex];
      
      if (!currentAccount) {
        throw new Error('Current account not found');
      }

      // Check sender balance before proceeding
      const senderBalance = parseFloat(getBalanceForAddress(currentAccount.address));
      const transactionAmount = parseFloat(amount);
      
      if (senderBalance < transactionAmount) {
        throw new Error(`Insufficient balance. Available: ${senderBalance} APT, Required: ${transactionAmount} APT`);
      }

      // Mock transaction - replace with actual wallet send logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update balances for both sender and receiver
      const balanceUpdates = updateBalancesAfterTransaction(
        currentAccount.address,
        recipient,
        amount
      );
      
      // Generate a mock transaction hash
      const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      // Create transaction object
      const transaction = {
        from: currentAccount.address,
        to: recipient,
        ethAmount: amount,
        aptosAmount: amount,
        inrAmount: parseFloat(amount) * 373, // Mock conversion rate
        timestamp: new Date(),
        txHash: txHash,
        type: 'sent' as const,
        status: 'confirmed' as const,
        note: note || undefined
      };

      // Store transaction in localStorage
      addTransactionToStorage(transaction);

      // Handle NFT minting after successful transaction
      const nftResults = handleTransactionAndMintNFTs(currentAccount.address);
      
      // Show success toast with NFT minting results
      let toastDescription = `Sent ${amount} APT to ${recipient.slice(0, 6)}...${recipient.slice(-4)}. New balance: ${balanceUpdates.senderBalance} APT`;
      
      if (nftResults.loyaltyNFT) {
        toastDescription += ` 🏆 New ${nftResults.loyaltyNFT.tier} loyalty NFT earned!`;
      }
      
      if (nftResults.offerNFT) {
        toastDescription += ` 🎁 Bonus offer NFT received: ${nftResults.offerNFT.discountPercentage}% off at ${nftResults.offerNFT.companyName}!`;
      }

      toast({
        title: "Transaction Sent Successfully",
        description: toastDescription,
        duration: 7000,
      });
      
      // Reset form
      setRecipient('');
      setAmount('');
      setNote('');
      
      // Call success callback to refresh transaction history
      onSuccess?.();
      
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed. Please try again.';
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

  const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Processing file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    setIsLoading(true);

    // Show loading toast
    toast({
      title: "Processing Image",
      description: "Scanning QR code from uploaded image...",
      duration: 5000,
    });

    try {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
      if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file (PNG, JPEG, GIF, WebP, BMP, or SVG)');
      }

      // Validate file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image file is too large. Please select a smaller image (max 10MB).');
      }

      // Check if QrScanner is available
      console.log('Checking QrScanner availability...');
      if (typeof QrScanner === 'undefined') {
        throw new Error('QR Scanner library not loaded. Please refresh the page and try again.');
      }

      if (typeof QrScanner.scanImage !== 'function') {
        console.error('QrScanner object:', QrScanner);
        throw new Error('QR Scanner scanImage method not available. Library may not be loaded correctly.');
      }

      console.log('QrScanner is available, attempting to scan...');

      // Try to scan the image
      const startTime = Date.now();
      const result = await QrScanner.scanImage(file);
      const endTime = Date.now();
      
      console.log('QR scan completed in', endTime - startTime, 'ms');
      console.log('QR scan result:', result);
      console.log('Result type:', typeof result);
      console.log('Result length:', result ? result.length : 'null/undefined');
      
      // Additional validation for Aptos addresses
      if (result && typeof result === 'string') {
        const trimmed = result.trim();
        console.log('Trimmed result:', trimmed);
        
        // Check if it looks like a valid address format
        if (trimmed.startsWith('0x') && trimmed.length >= 40) {
          console.log('✓ Result appears to be a valid address format');
        } else if (trimmed.length > 10) {
          console.log('⚠ Result doesn\'t look like a standard address but may be valid:', trimmed);
        }
      }
      
      if (result && typeof result === 'string' && result.trim()) {
        const trimmedResult = result.trim();
        console.log('Setting recipient to:', trimmedResult);
        setRecipient(trimmedResult);
        
        toast({
          title: "QR Code Scanned Successfully",
          description: `Address loaded: ${trimmedResult.length > 30 ? trimmedResult.slice(0, 30) + '...' : trimmedResult}`,
          duration: 3000,
        });
      } else {
        console.log('No valid result from QR scan, result was:', result);
        throw new Error('No valid QR code data found in image');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      let errorMessage = "Could not read QR code from image";
      if (error instanceof Error) {
        if (error.message.includes('file') || error.message.includes('image')) {
          errorMessage = error.message;
        } else if (error.message.toLowerCase().includes('no qr code found')) {
          errorMessage = "No QR code detected in the image. Please ensure the image contains a clear, readable QR code.";
        } else if (error.message.includes('data')) {
          errorMessage = "QR code found but contains invalid data. Please use a wallet address QR code.";
        } else if (error.message.includes('library') || error.message.includes('loaded')) {
          errorMessage = error.message;
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorMessage = "Network error while processing image. Please check your connection and try again.";
        } else {
          errorMessage = `Scan failed: ${error.message}`;
        }
      }
      
      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleQrScanClick = () => {
    console.log('QR scan button clicked');
    if (fileInputRef.current) {
      console.log('Opening file picker...');
      fileInputRef.current.click();
    } else {
      console.error('File input ref not found');
      toast({
        title: "Error",
        description: "File picker not available. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const testCameraPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      toast({
        title: "Camera Access OK",
        description: "Camera permissions are working",
        duration: 2000,
      });
      return true;
    } catch (error) {
      console.error('Camera permission test failed:', error);
      toast({
        title: "Camera Access Failed",
        description: "Please enable camera permissions or use HTTPS",
        variant: "destructive",
        duration: 4000,
      });
      return false;
    }
  };

  const startCameraScanning = async () => {
    try {
      // First test camera permissions
      const hasPermission = await testCameraPermissions();
      if (!hasPermission) return;

      setIsScanning(true);
      setShowQrScanner(true);

      // Wait for next tick to ensure DOM is updated
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      console.log('Creating QR scanner instance...');
      
      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          setRecipient(result.data);
          stopCameraScanning();
          toast({
            title: "QR Code Scanned",
            description: "Address has been filled automatically",
            duration: 3000,
          });
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 3,
        }
      );

      console.log('Starting QR scanner...');
      await qrScannerRef.current.start();
      setIsScanning(false); // Camera is now running
      console.log('QR scanner started successfully');
      
      toast({
        title: "Camera Ready",
        description: "Point your camera at a QR code",
        duration: 2000,
      });
    } catch (error) {
      console.error('Camera error:', error);
      setIsScanning(false);
      setShowQrScanner(false);
      
      let errorMessage = "Could not access camera. Please check permissions.";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied. Please allow camera access and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on this device.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera not supported. Try using HTTPS or a different browser.";
        } else if (error.message.includes('secure')) {
          errorMessage = "Camera requires HTTPS. Please use a secure connection.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const stopCameraScanning = () => {
    console.log('Stopping camera scanning...');
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
        console.log('Camera stopped successfully');
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }
    setIsScanning(false);
    setShowQrScanner(false);
  };

  // Cleanup on component unmount or dialog close
  React.useEffect(() => {
    if (!isOpen && qrScannerRef.current) {
      stopCameraScanning();
    }
  }, [isOpen]);

  const estimatedFee = '0.001 APT';
  const estimatedFiat = amount ? `≈ ₹${(parseFloat(amount) * 373).toFixed(2)}` : '₹0.00';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-black/95 backdrop-blur-md border border-gray-800 shadow-2xl">
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
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Recipient address (0x...)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="font-mono text-sm h-12 bg-gray-900 border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-gray-600 pr-12"
                />
                <Button
                  type="button"
                  onClick={handleQrScanClick}
                  className="absolute right-1 top-1 h-10 w-10 p-0 bg-gray-700 hover:bg-gray-600 rounded-md"
                  title="Scan QR Code"
                >
                  <QrCode className="h-4 w-4 text-white" />
                </Button>
              </div>
              
              {/* QR Scanner Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleQrScanClick}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  title="Upload an image containing a QR code"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload QR
                </Button>
                <Button
                  type="button"
                  onClick={startCameraScanning}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 bg-blue-800 border-blue-700 text-blue-300 hover:bg-blue-700 hover:text-white"
                  disabled={isScanning}
                >
                  <Camera className="h-3 w-3 mr-1" />
                  {isScanning ? 'Starting...' : 'Scan QR'}
                </Button>
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleQrUpload}
                className="hidden"
                title="Select an image containing a QR code"
              />
            </div>

            {/* Current Balance Display */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 mb-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Available Balance</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{currentBalance} APT</span>
                  <Button
                    type="button"
                    onClick={() => {
                      // Leave some for fees (0.001 APT)
                      const maxAmount = Math.max(0, parseFloat(currentBalance) - 0.001);
                      setAmount(maxAmount.toString());
                    }}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Max
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-right">
                ≈ ₹{(parseFloat(currentBalance) * 373).toFixed(2)}
              </div>
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

            {/* Camera QR Scanner */}
            {showQrScanner && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-medium">
                    {isScanning ? 'Starting Camera...' : 'Scan QR Code'}
                  </h3>
                  <Button
                    onClick={stopCameraScanning}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-48 bg-black rounded-lg object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="text-white text-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm">Initializing camera...</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 border-2 border-white rounded-lg opacity-50"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  {isScanning 
                    ? 'Please allow camera access when prompted'
                    : 'Point your camera at a QR code containing a wallet address'
                  }
                </p>
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