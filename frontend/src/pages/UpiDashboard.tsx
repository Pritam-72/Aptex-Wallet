import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Upload, Wallet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { getUserStats, getPaymentRequest, registerUpiId, getUpiIdByAddress, UserStats } from '@/utils/contractUtils';
import { getAccountBalance } from '@/utils/walletUtils';
import { BlockchainStats } from '@/components/dashboard/BlockchainStats';
import { useToast } from '@/hooks/use-toast';
import QrScanner from 'qr-scanner';

export const UpiDashboard: React.FC = () => {
  const { address } = useWallet();
  const { toast } = useToast();
  const [balance, setBalance] = useState<string>('0.0');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activePaymentRequests, setActivePaymentRequests] = useState(0);
  const [loyaltyTier, setLoyaltyTier] = useState<string>('None');
  const [registeredUpiId, setRegisteredUpiId] = useState<string | null>(null);
  const [isLoadingUpiId, setIsLoadingUpiId] = useState(false);
  
  // QR Code Upload states
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [extractedUpiId, setExtractedUpiId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current account from localStorage
  const getCurrentAccount = () => {
    try {
      const walletData = localStorage.getItem('cryptal_wallet');
      if (walletData) {
        const parsedWalletData = JSON.parse(walletData);
        const currentIndex = parsedWalletData.currentAccountIndex || 0;
        const currentAccount = parsedWalletData.accounts?.[currentIndex];
        return currentAccount || null;
      }
    } catch (error) {
      console.error('Error getting current wallet account:', error);
    }
    return null;
  };

  // Extract UPI ID from QR code data
  const extractUpiIdFromQrData = (qrData: string): string | null => {
    // Pattern 1: upi://pay?pa=jayesh152005-1@okicici&...
    // Pattern 2: upi://pay?pa=9236882056@axl&...
    const upiPayPattern = /pa=([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/;
    const match = qrData.match(upiPayPattern);
    
    if (match && match[1]) {
      return match[1];
    }
    
    // Direct UPI ID format (fallback)
    const directUpiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (directUpiPattern.test(qrData.trim())) {
      return qrData.trim();
    }
    
    return null;
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setQrImage(file);
    setIsScanning(true);
    setExtractedUpiId('');
    setRegistrationStatus('idle');

    try {
      // Scan QR code from image
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      const qrData = result.data;
      
      // Extract UPI ID from QR data
      const upiId = extractUpiIdFromQrData(qrData);
      
      if (upiId) {
        setExtractedUpiId(upiId);
        toast({
          title: "UPI ID Extracted! ✅",
          description: `Found UPI ID: ${upiId}`,
        });
      } else {
        toast({
          title: "No UPI ID Found",
          description: "Could not extract UPI ID from the QR code. Please try another image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      toast({
        title: "Scan Failed",
        description: "Could not read QR code from image. Please try a clearer image.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Register UPI ID on blockchain
  const handleRegisterUpiId = async () => {
    if (!extractedUpiId || !address) {
      toast({
        title: "Error",
        description: "Please connect wallet and scan QR code first",
        variant: "destructive",
      });
      return;
    }

    const currentAccount = getCurrentAccount();
    if (!currentAccount || !currentAccount.privateKey) {
      toast({
        title: "Error",
        description: "Could not access wallet account",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    setRegistrationStatus('idle');

    try {
      // Import getAccountFromPrivateKey
      const { getAccountFromPrivateKey } = await import('@/utils/contractUtils');
      const account = getAccountFromPrivateKey(currentAccount.privateKey);
      
      // Register on blockchain
      const result = await registerUpiId(account, extractedUpiId);
      
      if (result.success) {
        setRegistrationStatus('success');
        setRegisteredUpiId(extractedUpiId); // Update the registered UPI ID state
        toast({
          title: "Registration Successful! 🎉",
          description: `Your UPI ID "${extractedUpiId}" has been mapped to your wallet.`,
        });
      } else {
        setRegistrationStatus('error');
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to register UPI ID on blockchain",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationStatus('error');
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const loadBlockchainData = async (walletAddress: string) => {
    setStatsLoading(true);
    setIsLoadingUpiId(true);
    
    // Reset states when switching wallets
    setRegisteredUpiId(null);
    setBalance('0.0');
    setUserStats(null);
    setActivePaymentRequests(0);
    setLoyaltyTier('None');
    
    try {
      // Get balance
      const accountBalance = await getAccountBalance(walletAddress);
      setBalance(accountBalance);

      // Fetch registered UPI ID
      console.log('🔍 Requesting UPI ID for wallet:', walletAddress);
      const upiId = await getUpiIdByAddress(walletAddress);
      console.log('📥 Received UPI ID:', upiId, 'for wallet:', walletAddress);
      setRegisteredUpiId(upiId);
      setIsLoadingUpiId(false);

      // Fetch user stats from blockchain
      const stats = await getUserStats(walletAddress);
      setUserStats(stats);

      if (stats) {
        // Calculate loyalty tier based on transaction count
        const txCount = parseInt(stats.total_transactions);
        let tier = 'None';
        if (txCount >= 100) tier = 'Diamond';
        else if (txCount >= 50) tier = 'Platinum';
        else if (txCount >= 20) tier = 'Gold';
        else if (txCount >= 10) tier = 'Silver';
        else if (txCount >= 1) tier = 'Bronze';
        setLoyaltyTier(tier);
      } else {
        setLoyaltyTier('None');
      }

      // Count active payment requests (incoming) - OPTIMIZED
      let activeCount = 0;
      let consecutiveNotFound = 0;
      const MAX_CONSECUTIVE_NOT_FOUND = 3;
      
      for (let i = 0; i < 20; i++) { // Reduced from 50 to 20
        try {
          const request = await getPaymentRequest(i);
          if (request) {
            consecutiveNotFound = 0;
            if (request.to_address === walletAddress && request.status === 0) {
              activeCount++;
            }
          } else {
            consecutiveNotFound++;
            if (consecutiveNotFound >= MAX_CONSECUTIVE_NOT_FOUND) {
              break;
            }
          }
        } catch (error) {
          consecutiveNotFound++;
          if (consecutiveNotFound >= MAX_CONSECUTIVE_NOT_FOUND) {
            break;
          }
        }
      }
      setActivePaymentRequests(activeCount);

    } catch (error) {
      console.error('Error loading blockchain data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      // Reset form states when wallet changes
      setQrImage(null);
      setExtractedUpiId('');
      setIsScanning(false);
      setIsRegistering(false);
      setRegistrationStatus('idle');
      
      // Load blockchain data for new address
      loadBlockchainData(address);
    }
  }, [address]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Wallet Overview Card */}
      {address && (
        <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Wallet Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {parseFloat(balance).toFixed(4)} APT
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Blockchain Statistics */}
      {address && (
        <BlockchainStats
          transactionCount={userStats?.total_transactions?.toString() || '0'}
          totalVolume={userStats?.last_transaction_date?.toString() || '0'}
          loyaltyTier={loyaltyTier}
          activePaymentRequests={activePaymentRequests}
          isLoading={statsLoading}
        />
      )}

      {/* UPI QR Code Upload Card */}
      {address && (
        <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {registeredUpiId ? 'Registered UPI ID' : 'UPI QR Code Upload'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {registeredUpiId 
                    ? 'Your UPI ID is mapped to this wallet' 
                    : 'Upload your UPI QR code to link it with your wallet'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading State */}
            {isLoadingUpiId && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-muted-foreground">Loading UPI mapping...</span>
              </div>
            )}

            {/* Registered UPI ID Display */}
            {!isLoadingUpiId && registeredUpiId && (
              <Alert className="bg-green-900/20 border-green-700">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-300">
                  <strong>Your Registered UPI ID:</strong>
                  <div className="mt-3 p-4 bg-green-950/50 rounded-lg">
                    <p className="font-mono text-xl text-center">{registeredUpiId}</p>
                  </div>
                  <p className="mt-3 text-sm text-green-400">
                    This UPI ID is permanently mapped to your wallet address on the blockchain.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Interface - Only show if no UPI ID is registered */}
            {!isLoadingUpiId && !registeredUpiId && (
              <>
                {/* Upload Section */}
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {!qrImage ? (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium mb-2">Upload UPI QR Code</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Click to select an image containing your UPI QR code
                        </p>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        >
                          Select Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        {isScanning ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-sm">Scanning QR code...</span>
                          </>
                        ) : extractedUpiId ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-green-500">QR code scanned successfully!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="text-sm text-red-500">Failed to extract UPI ID</span>
                          </>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Selected: {qrImage.name}
                      </p>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setQrImage(null);
                          setExtractedUpiId('');
                          setRegistrationStatus('idle');
                        }}
                      >
                        Choose Different Image
                      </Button>
                    </div>
                  )}
                </div>

                {/* Extracted UPI ID Display */}
                {extractedUpiId && (
                  <Alert className="bg-green-900/20 border-green-700">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-300">
                      <strong>Extracted UPI ID:</strong>
                      <div className="mt-2 p-3 bg-green-950/50 rounded font-mono text-lg">
                        {extractedUpiId}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Registration Section */}
                {extractedUpiId && registrationStatus !== 'success' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Click the button below to register this UPI ID on the blockchain and map it to your wallet address.
                    </p>
                    <Button
                      onClick={handleRegisterUpiId}
                      disabled={isRegistering}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering on Blockchain...
                        </>
                      ) : (
                        'Register UPI ID on Blockchain'
                      )}
                    </Button>
                  </div>
                )}

                {/* Success Status */}
                {registrationStatus === 'success' && (
                  <Alert className="bg-blue-900/20 border-blue-700">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-300">
                      <strong>Successfully Registered! 🎉</strong>
                      <p className="mt-2">
                        Your UPI ID <span className="font-mono">{extractedUpiId}</span> is now mapped to your wallet address on the blockchain.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Status */}
                {registrationStatus === 'error' && (
                  <Alert className="bg-red-900/20 border-red-700">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-300">
                      <strong>Registration Failed</strong>
                      <p className="mt-2">
                        Could not register the UPI ID. Please try again or contact support.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Info Section */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">How it works:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Upload an image of your UPI QR code</li>
                    <li>We extract the UPI ID automatically</li>
                    <li>Register it on the blockchain to link with your wallet</li>
                    <li>Send/receive payments using your UPI ID</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Not Connected State */}
      {!address && (
        <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No Wallet Connected</p>
              <p className="text-sm">Please connect your wallet to view the UPI dashboard</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
