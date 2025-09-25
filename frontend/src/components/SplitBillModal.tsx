import React, { useState } from 'react';
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
  Calculator, 
  DollarSign, 
  User, 
  MessageSquare, 
  X, 
  AlertCircle,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  createBillSplit, 
  calculateEvenSplit, 
  calculateCustomSplit 
} from '@/utils/billSplitStorage';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  // Calculate even split
  const calculateEvenAmounts = () => {
    const validParticipants = participants.filter(p => p.address.trim());
    if (validParticipants.length === 0) return;

    const evenAmount = calculateEvenSplit(originalTransaction.amount, validParticipants.length);
    setParticipants(prev => prev.map(p => ({ ...p, amount: evenAmount })));
  };

  // Validate form
  const validateForm = () => {
    setError('');

    // Check if we have participants
    const validParticipants = participants.filter(p => p.address.trim());
    if (validParticipants.length === 0) {
      setError('Please add at least one participant');
      return false;
    }

    // Validate addresses
    for (const participant of validParticipants) {
      if (!participant.address.startsWith('0x') || participant.address.length < 10) {
        setError(`Invalid address format: ${participant.address}`);
        return false;
      }

      if (participant.address === userAddress) {
        setError('You cannot add yourself as a participant');
        return false;
      }
    }

    // Check for duplicate addresses
    const addresses = validParticipants.map(p => p.address);
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      setError('Duplicate addresses are not allowed');
      return false;
    }

    // Validate amounts for custom split
    if (splitType === 'custom') {
      for (const participant of validParticipants) {
        if (!participant.amount || parseFloat(participant.amount) <= 0) {
          setError('All participants must have a valid amount for custom split');
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
        setError(`Amount mismatch. Remaining: ${calculation.remaining} APT`);
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
    try {
      const validParticipants = participants.filter(p => p.address.trim());

      // Calculate final amounts
      let finalParticipants: { address: string; amount: string }[];
      
      if (splitType === 'even') {
        const evenAmount = calculateEvenSplit(originalTransaction.amount, validParticipants.length);
        finalParticipants = validParticipants.map(p => ({
          address: p.address,
          amount: evenAmount
        }));
      } else {
        finalParticipants = validParticipants.map(p => ({
          address: p.address,
          amount: p.amount
        }));
      }

      // Create bill split
      const billSplit = createBillSplit(
        originalTransaction.txHash,
        userAddress,
        originalTransaction.amount,
        description,
        finalParticipants
      );

      toast({
        title: "Bill Split Created! 🧾",
        description: `Split request sent to ${finalParticipants.length} participants`,
        duration: 5000,
      });

      // Reset form and close
      setParticipants([{ id: generateId(), address: '', amount: '' }]);
      setDescription('');
      setSplitType('even');
      setError('');
      onClose();

    } catch (error: any) {
      console.error('Error creating bill split:', error);
      setError('Failed to create bill split. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setParticipants([{ id: generateId(), address: '', amount: '' }]);
    setDescription(originalTransaction.description || '');
    setSplitType('even');
    setError('');
    onClose();
  };

  // Calculate total and remaining for custom split
  const getCustomSplitInfo = () => {
    if (splitType !== 'custom') return null;

    const validParticipants = participants.filter(p => p.address.trim() && p.amount);
    const customAmounts: Record<string, string> = {};
    validParticipants.forEach(p => {
      customAmounts[p.address] = p.amount;
    });

    return calculateCustomSplit(originalTransaction.amount, customAmounts);
  };

  const customSplitInfo = getCustomSplitInfo();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-md border border-gray-800 shadow-2xl">
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
            <div className="h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-white">
            Split the Bill
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Split this transaction with others and send payment requests
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          {/* Original Transaction Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">Original Transaction</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Amount:</span>
                <span className="text-sm font-semibold text-white">{originalTransaction.amount} APT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Hash:</span>
                <span className="text-xs font-mono text-gray-300">
                  {originalTransaction.txHash.slice(0, 8)}...{originalTransaction.txHash.slice(-6)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="bg-red-900/50 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Split Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-300">Split Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setSplitType('even')}
                variant={splitType === 'even' ? 'default' : 'outline'}
                className={`flex-1 ${
                  splitType === 'even' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Even Split
              </Button>
              <Button
                type="button"
                onClick={() => setSplitType('custom')}
                variant={splitType === 'custom' ? 'default' : 'outline'}
                className={`flex-1 ${
                  splitType === 'custom' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Custom Split
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="What was this expense for? (e.g., Dinner at restaurant, Movie tickets...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 min-h-[80px] resize-none"
              disabled={isSubmitting}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">{description.length}/200 characters</p>
          </div>

          {/* Participants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Participants ({participants.filter(p => p.address.trim()).length})
              </Label>
              <Button
                type="button"
                onClick={addParticipant}
                size="sm"
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {participants.map((participant, index) => (
                <div key={participant.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      Participant {index + 1}
                    </span>
                    {participants.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeParticipant(participant.id)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className={`grid gap-3 ${splitType === 'custom' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    <div>
                      <Label className="text-xs text-gray-400 mb-1 block">
                        Wallet Address
                      </Label>
                      <Input
                        placeholder="0x1234567890abcdef..."
                        value={participant.address}
                        onChange={(e) => updateParticipantAddress(participant.id, e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 font-mono text-sm"
                        disabled={isSubmitting}
                      />
                    </div>

                    {splitType === 'custom' && (
                      <div>
                        <Label className="text-xs text-gray-400 mb-1 block">
                          Amount (APT)
                        </Label>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="0.00"
                          value={participant.amount}
                          onChange={(e) => updateParticipantAmount(participant.id, e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                  </div>

                  {splitType === 'even' && participant.address.trim() && (
                    <div className="mt-2 text-xs text-gray-400">
                      Will pay: {calculateEvenSplit(originalTransaction.amount, participants.filter(p => p.address.trim()).length)} APT
                    </div>
                  )}
                </div>
              ))}
            </div>

            {splitType === 'even' && (
              <Button
                type="button"
                onClick={calculateEvenAmounts}
                variant="outline"
                size="sm"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Even Split
              </Button>
            )}
          </div>

          {/* Custom Split Summary */}
          {splitType === 'custom' && customSplitInfo && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Split Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-white">{originalTransaction.amount} APT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Allocated:</span>
                  <span className="text-white">
                    {(parseFloat(originalTransaction.amount) - parseFloat(customSplitInfo.remaining)).toFixed(6)} APT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Remaining:</span>
                  <span className={`${parseFloat(customSplitInfo.remaining) === 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {customSplitInfo.remaining} APT
                  </span>
                </div>
              </div>
              {customSplitInfo.valid && (
                <div className="flex items-center gap-2 mt-2 text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Amounts balanced correctly
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || participants.filter(p => p.address.trim()).length === 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Split...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Create Bill Split
                </div>
              )}
            </Button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-400">
              💡 Each participant will receive a payment request for their share. 
              They can accept or reject the request from their dashboard.
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};