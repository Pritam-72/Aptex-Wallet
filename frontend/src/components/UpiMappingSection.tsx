import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, CreditCard, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import {
  registerUpiId,
  getUpiIdByAddress,
  getAddressByUpiId,
  getAccountFromPrivateKey,
  parseContractError
} from '@/utils/contractUtils';

interface UpiMapping {
  upiId: string;
  address: string;
  registeredAt: Date;
}

export const UpiMappingSection: React.FC = () => {
  const [existingUpiId, setExistingUpiId] = useState<string | null>(null);
  const [newUpiId, setNewUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

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

  const currentAccount = getCurrentAccount();
  const address = currentAccount?.address || null;

  // Load existing UPI ID on component mount
  useEffect(() => {
    const loadExistingUpiId = async () => {
      if (!address) return;
      
      setIsCheckingExisting(true);
      try {
        const upiId = await getUpiIdByAddress(address);
        if (upiId) {
          setExistingUpiId(upiId);
          setNewUpiId(upiId);
        }
      } catch (error) {
        console.error('Error loading existing UPI ID:', error);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    loadExistingUpiId();
  }, [address]);

  const handleAddMapping = async () => {
    setError('');
    setSuccess(false);

    // Check if user already has a UPI ID registered
    if (existingUpiId) {
      setError('You have already registered a UPI ID: ' + existingUpiId);
      return;
    }

    // Check wallet connection
    if (!currentAccount || !address) {
      setError('Please connect your wallet first');
      return;
    }

    // Validation
    if (!newUpiId.trim()) {
      setError('Please enter a UPI ID');
      return;
    }

    // Basic UPI ID format validation (username@provider)
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(newUpiId)) {
      setError('Please enter a valid UPI ID format (e.g., yourname@paytm)');
      return;
    }

    setIsLoading(true);

    try {
      // Check if UPI ID is already taken
      const existingAddress = await getAddressByUpiId(newUpiId);
      if (existingAddress) {
        setError('This UPI ID is already registered by another user');
        setIsLoading(false);
        return;
      }

      // Get account from private key to sign transaction
      const account = getAccountFromPrivateKey(currentAccount.privateKey);
      
      // Register UPI ID on-chain
      const result = await registerUpiId(account, newUpiId);
      
      if (result.success && result.hash) {
        setSuccess(true);
        setExistingUpiId(newUpiId);
        
        toast({
          title: "UPI ID Registered! 🎉",
          description: `Your UPI ID "${newUpiId}" has been registered successfully.`,
          duration: 5000,
        });
        
        // Reset form after delay
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        const errorMsg = result.error ? parseContractError(result.error) : 'Failed to register UPI ID';
        setError(errorMsg);
        
        toast({
          title: "Registration Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to register UPI ID';
      setError(errorMsg);
      
      toast({
        title: "Registration Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            UPI Integration
          </CardTitle>
          <CardDescription className="text-gray-400">
            Link your UPI IDs to your wallet for easy transactions. Others can send you money using your UPI ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-950 border-red-800 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {existingUpiId && (
            <Alert className="bg-green-500/10 border-green-500/20 text-green-300">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your UPI ID <strong>{existingUpiId}</strong> is registered and mapped to your wallet.
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/10 border-green-500/20 text-green-300">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                UPI ID registered successfully! Others can now send payments to your UPI ID.
              </AlertDescription>
            </Alert>
          )}

          {/* Add New UPI Mapping */}
          <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium">
              {existingUpiId ? 'Your Registered UPI ID' : 'Register UPI ID'}
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="upiId" className="text-gray-300">UPI ID</Label>
              <Input
                id="upiId"
                type="text"
                placeholder="yourname@paytm"
                value={newUpiId}
                onChange={(e) => setNewUpiId(e.target.value.toLowerCase())}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                disabled={isLoading || isCheckingExisting || !!existingUpiId}
              />
              <p className="text-xs text-gray-400">
                Enter your UPI ID in the format: username@provider (e.g., yourname@paytm, yourname@phonepe)
              </p>
            </div>

            {address && (
              <div className="space-y-2">
                <Label className="text-gray-300">Wallet Address</Label>
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400 font-mono break-all">{address}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleAddMapping}
              disabled={isLoading || isCheckingExisting || !newUpiId.trim() || !!existingUpiId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
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
              ) : existingUpiId ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Already Registered
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Register UPI ID
                </>
              )}
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-950/50 border border-blue-800 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">How it works:</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Map your UPI IDs to your current wallet address</li>
              <li>• Others can send you crypto by entering your UPI ID</li>
              <li>• UPI QR codes will automatically resolve to your wallet</li>
              <li>• You can have multiple UPI IDs mapped to the same wallet</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};