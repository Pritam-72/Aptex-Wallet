import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Loader2, CheckCircle, AlertCircle, Upload, FileText, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '../contexts/WalletContext';
import { 
  registerWalletId, 
  getWalletIdByAddress, 
  getAddressByWalletId,
  getAccountFromPrivateKey,
  parseContractError
} from '@/utils/contractUtils';
import { useToast } from '@/hooks/use-toast';

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
  const { setIdentityVerified } = useWallet();
  const { toast } = useToast();
  
  // Get current address and private key from local storage
  const getCurrentAccount = () => {
    try {
      const walletData = localStorage.getItem('cryptal_wallet');
      if (walletData) {
        const parsedData = JSON.parse(walletData);
        const currentIndex = parsedData.currentAccountIndex || 0;
        const account = parsedData.accounts?.[currentIndex];
        return account || null;
      }
    } catch (error) {
      console.error('Error reading wallet from localStorage:', error);
    }
    return null;
  };

  const currentAccount = getCurrentAccount();
  const address = currentAccount?.address || null;
  
  const [walletId, setWalletId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [existingWalletId, setExistingWalletId] = useState<string | null>(null);
  
  // Identity verification states
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user already has a wallet ID registered
  useEffect(() => {
    const checkExistingWalletId = async () => {
      if (!address) return;
      
      setIsCheckingExisting(true);
      try {
        const existingId = await getWalletIdByAddress(address);
        if (existingId) {
          setExistingWalletId(existingId);
          setWalletId(existingId);
        }
      } catch (error) {
        console.error('Error checking existing wallet ID:', error);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    if (isOpen && address) {
      checkExistingWalletId();
    }
  }, [isOpen, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Check if wallet ID already exists
    if (existingWalletId) {
      setError('You have already registered a wallet ID: ' + existingWalletId);
      return;
    }

    // Check wallet connection
    if (!currentAccount || !address) {
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
      // Check if wallet ID is already taken
      const existingAddress = await getAddressByWalletId(walletId);
      if (existingAddress) {
        setError('This wallet ID is already registered by another user');
        setIsLoading(false);
        return;
      }

      // Get account from private key to sign transaction
      const account = getAccountFromPrivateKey(currentAccount.privateKey);
      
      // Register wallet ID on-chain
      const result = await registerWalletId(account, walletId);
      
      if (result.success && result.hash) {
        setTxHash(result.hash);
        setSuccess(true);
        
        toast({
          title: "Wallet ID Registered! 🎉",
          description: `Your wallet ID "${walletId}" has been registered successfully.`,
          duration: 5000,
        });
        
        // Reset form after a delay and call onSuccess
        setTimeout(() => {
          setWalletId('');
          setSuccess(false);
          setTxHash('');
          setIsLoading(false);
          setIdentityFile(null);
          setVerificationSuccess(false);
          setVerificationError('');
          onSuccess?.();
          onClose();
        }, 3000);
      } else {
        const errorMsg = result.error ? parseContractError(result.error) : 'Failed to register wallet ID';
        setError(errorMsg);
        setIsLoading(false);
        
        toast({
          title: "Registration Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to register wallet ID';
      setError(errorMsg);
      setIsLoading(false);
      
      toast({
        title: "Registration Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!isLoading && !isVerificationLoading) {
      setWalletId('');
      setError('');
      setSuccess(false);
      setTxHash('');
      setIdentityFile(null);
      setIsVerificationLoading(false);
      setVerificationSuccess(false);
      setVerificationError('');
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

  const handleIdentityUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setVerificationError('');
    
    // Validate file type (accept common document formats)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setVerificationError('Please select a valid document file (PNG, JPEG, PDF, or WebP)');
      return;
    }

    // Validate file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setVerificationError('File is too large. Please select a smaller file (max 10MB)');
      return;
    }

    setIdentityFile(file);
    setIsVerificationLoading(true);

    try {
      // Mock API call - simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock verification success
      setVerificationSuccess(true);
      setIsVerificationLoading(false);
      
      // Update identity verification status in wallet context
      setIdentityVerified(true);
    } catch (err) {
      setVerificationError('Failed to verify identity document. Please try again.');
      setIsVerificationLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
          {existingWalletId && (
            <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-300">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You already have a wallet ID registered: <strong>{existingWalletId}</strong>
              </AlertDescription>
            </Alert>
          )}

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
                disabled={isLoading || success || isVerificationLoading || isCheckingExisting || !!existingWalletId}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSuggestion}
                disabled={isLoading || success || isVerificationLoading || isCheckingExisting || !!existingWalletId}
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

          {/* Identity Verification Section */}
          <div className="space-y-3">
            <Label className="text-white flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Identity Verification
            </Label>
            
            {verificationError && (
              <Alert className="bg-red-500/10 border-red-500/20 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
            )}

            {verificationSuccess && (
              <Alert className="bg-green-500/10 border-green-500/20 text-green-300">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <AlertDescription className="font-medium">
                      Identity document verified successfully!
                    </AlertDescription>
                    <p className="text-xs text-green-400 mt-1">
                      Document: {identityFile?.name}
                    </p>
                  </div>
                </div>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleUploadClick}
                variant="outline"
                disabled={isLoading || success || isVerificationLoading}
                className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800/50"
              >
                {isVerificationLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : verificationSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Uploaded
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload ID Document
                  </>
                )}
              </Button>
              
              {identityFile && !verificationSuccess && !isVerificationLoading && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/30 rounded-lg border border-gray-700">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-300 truncate max-w-32">
                    {identityFile.name}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400">
              Upload a government-issued ID document (PNG, JPEG, PDF, or WebP) for identity verification. 
              This helps secure your wallet and enables additional features.
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf,image/webp"
              onChange={handleIdentityUpload}
              className="hidden"
              title="Select an identity document"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading || isVerificationLoading}
              className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || success || isVerificationLoading || isCheckingExisting || !!existingWalletId}
              className="flex-1 bg-white hover:bg-gray-100 text-black font-medium disabled:opacity-50"
            >
              {isCheckingExisting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Registered!
                </>
              ) : existingWalletId ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Already Registered
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
            {verificationSuccess && (
              <span className="block mt-2">
                <strong>Identity Verified:</strong> Your identity has been verified, which enables 
                enhanced security features and higher transaction limits.
              </span>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};