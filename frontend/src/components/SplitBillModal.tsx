import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Trash2, 
  DollarSign, 
  User, 
  X, 
  AlertCircle,
  Split,
  Loader2,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  createSplitBill,
  getAccountFromPrivateKey,
  aptToOctas,
  resolveRecipient,
  aptos
} from '@/utils/contractUtils';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalTransaction: {
    txHash: string;
    amount: string;
    description?: string;
  };
  userAddress: string;
}

interface Participant {
  id: string;
  address: string;
  amount: string;
  recipientType?: 'address' | 'walletId' | 'upiId';
  resolvedAddress?: string;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  onClose,
  originalTransaction,
  userAddress
}) => {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', address: '', amount: '' }
  ]);
  const [description, setDescription] = useState(originalTransaction.description || '');
  const [splitType, setSplitType] = useState<'even' | 'custom'>('even');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvingParticipant, setResolvingParticipant] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper function to calculate custom split validation
  const calculateCustomSplit = (totalAmount: string, customAmounts: Record<string, string>) => {
    const total = parseFloat(totalAmount);
    const sum = Object.values(customAmounts).reduce((acc, amt) => acc + parseFloat(amt || '0'), 0);
    const remaining = total - sum;
    
    return {
      valid: Math.abs(remaining) < 0.00000001, // Account for floating point precision
      remaining: remaining.toFixed(8)
    };
  };

  // Resolve participant addresses with debounce
  useEffect(() => {
    if (success) return;

    const timeoutIds: NodeJS.Timeout[] = [];

    for (const participant of participants) {
      if (!participant.address.trim() || participant.resolvedAddress) continue;

      const timeoutId = setTimeout(async () => {
        setResolvingParticipant(participant.id);
        try {
          const result = await resolveRecipient(participant.address);
          setParticipants(prev => prev.map(p =>
            p.id === participant.id
              ? { ...p, resolvedAddress: result.address, recipientType: result.type }
              : p
          ));
        } catch (err) {
          // Clear resolution if invalid
          setParticipants(prev => prev.map(p =>
            p.id === participant.id
              ? { ...p, resolvedAddress: undefined, recipientType: undefined }
              : p
          ));
        } finally {
          setResolvingParticipant(null);
        }
      }, 500);

      timeoutIds.push(timeoutId);
    }

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants.map(p => p.address).join(','), success]);

  // Generate unique ID for participants
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

  // Add new participant
  const addParticipant = () => {
    setParticipants(prev => [
      ...prev,
      { id: generateId(), address: '', amount: '' }
    ]);
  };

  // Remove participant
  const removeParticipant = (id: string) => {
    if (participants.length > 1) {
      setParticipants(prev => prev.filter(p => p.id !== id));
    }
  };

  // Update participant address
  const updateParticipantAddress = (id: string, address: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === id ? { ...p, address } : p
    ));
  };

  // Update participant amount (for custom split)
  const updateParticipantAmount = (id: string, amount: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === id ? { ...p, amount } : p
    ));
  };

  // Clear error
  const clearError = () => setError('');

  // Close modal and reset state
  const handleClose = () => {
    setParticipants([{ id: '1', address: '', amount: '' }]);
    setDescription(originalTransaction.description || '');
    setSplitType('even');
    setError('');
    setSuccess(false);
    setTxHash('');
    setIsSubmitting(false);
    onClose();
  };

  // Validate form
  const validateForm = () => {
    clearError();

    const validParticipants = participants.filter(p => p.address.trim());
    
    if (validParticipants.length === 0) {
      setError('Please add at least one participant');
      return false;
    }

    // Check that all participants have valid wallet IDs (must be resolved)
    for (const participant of validParticipants) {
      if (!participant.resolvedAddress) {
        setError(`Invalid or unregistered wallet ID: "${participant.address}". Please ensure the wallet ID is registered.`);
        return false;
      }
    }

    // For custom split, validate amounts
    if (splitType === 'custom') {
      for (const participant of validParticipants) {
        if (!participant.amount || parseFloat(participant.amount) <= 0) {
          setError('Please enter valid amounts for all participants');
          return false;
        }
      }

      // Check if total matches
      const customAmounts: Record<string, string> = {};
      validParticipants.forEach(p => {
        customAmounts[p.address] = p.amount;
      });

      const calculation = calculateCustomSplit(originalTransaction.amount, customAmounts);
      if (!calculation.valid) {
        setError(`Amount mismatch. Total should be ${originalTransaction.amount} APT. Remaining: ${calculation.remaining} APT`);
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // Get wallet data (using correct storage key)
      const storedWallet = localStorage.getItem('cryptal_wallet');
      if (!storedWallet) {
        setError('Wallet not found. Please create or import a wallet first.');
        setIsSubmitting(false);
        return;
      }

      const walletData = JSON.parse(storedWallet);
      const currentIndex = walletData.currentAccountIndex || 0;
      const currentAccount = walletData.accounts?.[currentIndex];
      
      if (!currentAccount || !currentAccount.privateKey) {
        setError('Account not found. Please ensure your wallet is properly set up.');
        setIsSubmitting(false);
        return;
      }

      const account = getAccountFromPrivateKey(currentAccount.privateKey);

      console.log('👤 Creator account:', {
        address: account.accountAddress.toString(),
        userAddress: userAddress
      });

      // Get valid participants with resolved addresses
      const validParticipants = participants.filter(p => p.address.trim());
      
      // Prepare split data
      const totalAmount = parseFloat(originalTransaction.amount);
      const participantWalletIds: string[] = [];
      const participantAmounts: string[] = [];

      console.log('🔍 Preparing split bill data:', {
        validParticipantsCount: validParticipants.length,
        participants: validParticipants.map(p => ({
          input: p.address,
          resolvedAddress: p.resolvedAddress,
          recipientType: p.recipientType
        }))
      });

      if (splitType === 'even') {
        // Even split
        const amountPerPerson = totalAmount / validParticipants.length;
        const amountInOctas = aptToOctas(amountPerPerson);

        for (const participant of validParticipants) {
          // Use the original wallet ID input (not resolved address)
          participantWalletIds.push(participant.address);
          participantAmounts.push(amountInOctas);
        }
      } else {
        // Custom split
        for (const participant of validParticipants) {
          // Use the original wallet ID input (not resolved address)
          const amountInOctas = aptToOctas(parseFloat(participant.amount));
          
          participantWalletIds.push(participant.address);
          participantAmounts.push(amountInOctas);
        }
      }

      console.log('📤 Sending to contract:', {
        participantWalletIds,
        participantAmounts,
        description: description || 'Split bill'
      });

      // Verify all wallet IDs exist before sending (bypass cache for fresh check)
      console.log('🔄 Verifying wallet IDs (bypassing cache)...');
      for (const walletId of participantWalletIds) {
        // Direct check without cache
        const checkResult = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::wallet_system::get_address_by_wallet_id`,
            functionArguments: [CONTRACT_ADDRESS, walletId],
          },
        });
        
        console.log(`📋 Direct check for "${walletId}":`, checkResult);
        
        if (!checkResult || !Array.isArray(checkResult) || checkResult.length === 0) {
          throw new Error(`Wallet ID "${walletId}" not found in contract registry. Please ensure it's registered.`);
        }
        
        const option = checkResult[0] as Record<string, unknown>;
        if (!option.vec || !Array.isArray(option.vec) || option.vec.length === 0) {
          throw new Error(`Wallet ID "${walletId}" not found in contract registry. Please ensure it's registered.`);
        }
        
        console.log(`✅ Verified wallet ID "${walletId}" -> ${option.vec[0]}`);
      }

      // Create split bill on-chain
      const result = await createSplitBill(
        account,
        description || 'Split bill',
        participantWalletIds,
        participantAmounts
      );

      setTxHash(result.hash);
      setSuccess(true);

      toast({
        title: "Split Bill Created!",
        description: `Bill split among ${validParticipants.length} participants.`,
        duration: 5000,
      });

      // Close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error creating split bill:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create split bill';
      setError(errorMessage);
      
      toast({
        title: "Split Bill Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-black border border-gray-800">
        <DialogHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-gray-900 rounded-full flex items-center justify-center">
              <Split className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-white">
            Split Transaction
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Divide this transaction among multiple participants
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Alert */}
          {success && (
            <Alert className="bg-green-900/50 border-green-700">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                <div>Split bill created successfully!</div>
                {txHash && (
                  <div className="text-xs mt-1 break-all">
                    TX: {txHash.slice(0, 20)}...{txHash.slice(-20)}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && !success && (
            <Alert className="bg-red-900/20 border-red-800 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Original Transaction Info */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Total Amount</span>
              <span className="text-lg font-semibold text-white">
                {originalTransaction.amount} APT
              </span>
            </div>
            {originalTransaction.txHash && (
              <div className="text-xs text-gray-500 font-mono">
                {originalTransaction.txHash.slice(0, 20)}...{originalTransaction.txHash.slice(-15)}
              </div>
            )}
          </div>

          {/* Split Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-300">Split Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setSplitType('even')}
                variant={splitType === 'even' ? 'default' : 'outline'}
                className={`h-12 ${
                  splitType === 'even' 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'border-gray-700 hover:bg-gray-800'
                }`}
              >
                Even Split
              </Button>
              <Button
                type="button"
                onClick={() => setSplitType('custom')}
                variant={splitType === 'custom' ? 'default' : 'outline'}
                className={`h-12 ${
                  splitType === 'custom' 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'border-gray-700 hover:bg-gray-800'
                }`}
              >
                Custom Split
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-300">Description</Label>
            <Textarea
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
              disabled={isSubmitting}
              maxLength={200}
              rows={3}
            />
          </div>

          {/* Participants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-300">
                Participants ({participants.filter(p => p.address.trim()).length})
              </Label>
              <Button
                type="button"
                onClick={addParticipant}
                variant="outline"
                size="sm"
                className="border-gray-700 hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-6 w-6 bg-gray-800 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-300">
                      Person {index + 1}
                    </span>
                    {participant.recipientType && (
                      <Badge variant="outline" className="text-xs">
                        {participant.recipientType === 'walletId' ? (
                          <><User className="h-3 w-3 mr-1" />Wallet ID</>
                        ) : participant.recipientType === 'upiId' ? (
                          <><CreditCard className="h-3 w-3 mr-1" />UPI ID</>
                        ) : (
                          'Address'
                        )}
                      </Badge>
                    )}
                    {participants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(participant.id)}
                        className="ml-auto h-6 w-6 p-0 hover:bg-red-900/20 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Input
                        placeholder="Enter registered Wallet ID (e.g., testing1)..."
                        value={participant.address}
                        onChange={(e) => updateParticipantAddress(participant.id, e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 text-sm"
                        disabled={isSubmitting || success}
                      />
                      {resolvingParticipant === participant.id && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Verifying wallet ID...
                        </p>
                      )}
                      {participant.address.trim() && !resolvingParticipant && participant.resolvedAddress && (
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Wallet ID found: {participant.resolvedAddress.slice(0, 6)}...{participant.resolvedAddress.slice(-4)}
                        </p>
                      )}
                      {participant.address.trim() && !resolvingParticipant && !participant.resolvedAddress && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Wallet ID not registered
                        </p>
                      )}
                    </div>
                    
                    {splitType === 'custom' ? (
                      <Input
                        type="number"
                        step="0.00000001"
                        placeholder="0.00000000"
                        value={participant.amount}
                        onChange={(e) => updateParticipantAmount(participant.id, e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                        disabled={isSubmitting || success}
                      />
                    ) : (
                      participant.address.trim() && (
                        <div className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300">
                          {participants.filter(p => p.address.trim()).length > 0
                            ? (parseFloat(originalTransaction.amount) / participants.filter(p => p.address.trim()).length).toFixed(8)
                            : '0.00'
                          } APT
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-gray-700 hover:bg-gray-800"
            >
              {success ? 'Close' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || success || participants.filter(p => p.address.trim()).length === 0 || resolvingParticipant !== null}
              className="flex-1 bg-white text-black hover:bg-gray-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Split Bill...
                </div>
              ) : success ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Split Bill Created!
                </div>
              ) : (
                `Create Split (${participants.filter(p => p.address.trim()).length})`
              )}
            </Button>
          </div>

          {!success && (
            <div className="text-center text-xs text-gray-500">
              <p>✓ On-chain split bill tracking</p>
              <p className="mt-1">✓ Participants must have registered Wallet IDs</p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};