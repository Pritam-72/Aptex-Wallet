/**
 * AutoPayModal - Smart Contract Integrated Version
 * Reference implementation - copy this to replace AutoPayModal.tsx
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  Calendar, 
  DollarSign, 
  X, 
  AlertCircle,
  CheckCircle,
  Zap,
  Settings,
  ArrowRight
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  createEmiAgreementByUser, 
  approveEmiAutoPay, 
  aptToOctas,
  getWalletIdByAddress,
  resolveRecipient,
  checkSufficientBalance,
  CONTRACT_ADDRESS,
  getAccountFromPrivateKey,
  getUserEmis
} from '@/utils/contractUtils';

interface AutoPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  onSuccess?: () => void;
}

interface AutoPaySetup {
  recipientIdentifier: string;
  monthlyAmount: string;
  durationMonths: string;
  initialDeposit: string;
}

export const AutoPayModal: React.FC<AutoPayModalProps> = ({
  isOpen,
  onClose,
  userAddress,
  onSuccess
}) => {
  const [formData, setFormData] = useState<AutoPaySetup>({
    recipientIdentifier: '',
    monthlyAmount: '',
    durationMonths: '',
    initialDeposit: ''
  });
  const [step, setStep] = useState<'setup' | 'deposit'>('setup');
  const [createdEmiId, setCreatedEmiId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientWalletId, setRecipientWalletId] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const { toast } = useToast();

  // Handle form field changes
  const handleInputChange = (field: keyof AutoPaySetup, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  // Resolve recipient on identifier change
  useEffect(() => {
    const resolveRecipientInfo = async () => {
      if (!formData.recipientIdentifier.trim()) {
        setRecipientWalletId('');
        setRecipientAddress('');
        return;
      }

      try {
        const result = await resolveRecipient(formData.recipientIdentifier);
        
        if (result.address) {
          setRecipientAddress(result.address);
          
          if (result.type === 'walletId') {
            setRecipientWalletId(formData.recipientIdentifier);
          } else {
            const walletId = await getWalletIdByAddress(result.address);
            if (walletId) {
              setRecipientWalletId(walletId);
            } else {
              setError('Recipient must have a registered wallet ID for AutoPay');
              setRecipientWalletId('');
            }
          }
        } else {
          setError('Recipient not found. Please check the identifier.');
          setRecipientWalletId('');
          setRecipientAddress('');
        }
      } catch (err) {
        console.error('Error resolving recipient:', err);
        setRecipientWalletId('');
        setRecipientAddress('');
      }
    };

    const timeoutId = setTimeout(resolveRecipientInfo, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.recipientIdentifier]);

  // Validate setup form
  const validateSetupForm = () => {
    setError('');

    if (!formData.recipientIdentifier.trim()) {
      setError('Recipient identifier is required');
      return false;
    }

    if (!recipientWalletId) {
      setError('Recipient must have a registered wallet ID for AutoPay');
      return false;
    }

    if (recipientAddress === userAddress) {
      setError('Cannot set up autopay to your own address');
      return false;
    }

    if (!formData.monthlyAmount || parseFloat(formData.monthlyAmount) <= 0) {
      setError('Monthly amount must be greater than 0');
      return false;
    }

    if (!formData.durationMonths || parseInt(formData.durationMonths) <= 0) {
      setError('Duration must be at least 1 month');
      return false;
    }

    if (parseInt(formData.durationMonths) > 60) {
      setError('Duration cannot exceed 60 months');
      return false;
    }

    return true;
  };

  // Validate deposit form
  const validateDepositForm = () => {
    setError('');

    if (!formData.initialDeposit || parseFloat(formData.initialDeposit) <= 0) {
      setError('Initial deposit must be greater than 0');
      return false;
    }

    const monthlyAmount = parseFloat(formData.monthlyAmount);
    const deposit = parseFloat(formData.initialDeposit);

    if (deposit < monthlyAmount) {
      setError(`Initial deposit must be at least ${monthlyAmount} APT (one month's payment)`);
      return false;
    }

    return true;
  };

  // Calculate payment info
  const calculatePaymentInfo = () => {
    const monthlyAmount = parseFloat(formData.monthlyAmount) || 0;
    const months = parseInt(formData.durationMonths) || 0;
    const totalAmount = monthlyAmount * months;
    const deposit = parseFloat(formData.initialDeposit) || 0;

    return {
      monthlyAmount,
      totalAmount,
      months,
      deposit
    };
  };

  // Step 1: Create EMI Agreement
  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSetupForm()) return;

    setIsSubmitting(true);
    try {
      // Get account from localStorage
      const storedWallet = localStorage.getItem('cryptal_wallet');
      if (!storedWallet) {
        throw new Error('Wallet not found');
      }

      const walletData = JSON.parse(storedWallet);
      const currentIndex = walletData.currentAccountIndex || 0;
      const currentAccount = walletData.accounts?.[currentIndex];
      
      if (!currentAccount || !currentAccount.privateKey) {
        throw new Error('Account not found');
      }

      const account = getAccountFromPrivateKey(currentAccount.privateKey);
      const paymentInfo = calculatePaymentInfo();

      const totalAmountOctas = aptToOctas(paymentInfo.totalAmount);
      const monthlyAmountOctas = aptToOctas(paymentInfo.monthlyAmount);

      console.log('🚀 Creating EMI Agreement:', {
        recipientWalletId,
        totalAmountOctas,
        monthlyAmountOctas,
        months: paymentInfo.months
      });

      const result = await createEmiAgreementByUser(
        account,
        recipientWalletId,
        totalAmountOctas,
        monthlyAmountOctas,
        paymentInfo.months,
        `AutoPay: ${paymentInfo.monthlyAmount} APT/month for ${paymentInfo.months} months`
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create autopay agreement');
      }

      toast({
        title: "Agreement Created! ✅",
        description: `AutoPay agreement created successfully. Now deposit funds to activate.`,
        duration: 5000,
      });

      // Get the created EMI ID
      try {
        const userEmis = await getUserEmis(userAddress);
        if (userEmis && userEmis.length > 0) {
          const latestEmiId = userEmis[userEmis.length - 1];
          setCreatedEmiId(latestEmiId);
        }
      } catch (emiError) {
        console.warn('Could not fetch EMI ID:', emiError);
      }

      setStep('deposit');

    } catch (err) {
      console.error('Error creating agreement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create autopay agreement';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Approve AutoPay with Deposit
  const handleApproveAutoPay = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDepositForm()) return;

    // Get EMI ID if not already set
    if (!createdEmiId) {
      try {
        const userEmis = await getUserEmis(userAddress);
        if (userEmis && userEmis.length > 0) {
          const latestEmiId = userEmis[userEmis.length - 1];
          setCreatedEmiId(latestEmiId);
        } else {
          throw new Error('Could not find the created EMI agreement');
        }
      } catch (emiError) {
        setError('Could not find the created EMI agreement. Please try again.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Get account from localStorage
      const storedWallet = localStorage.getItem('cryptal_wallet');
      if (!storedWallet) {
        throw new Error('Wallet not found');
      }

      const walletData = JSON.parse(storedWallet);
      const currentIndex = walletData.currentAccountIndex || 0;
      const currentAccount = walletData.accounts?.[currentIndex];
      
      if (!currentAccount || !currentAccount.privateKey) {
        throw new Error('Account not found');
      }

      const account = getAccountFromPrivateKey(currentAccount.privateKey);
      const paymentInfo = calculatePaymentInfo();

      const depositAmountOctas = aptToOctas(paymentInfo.deposit);
      const gasEstimate = 0.001;
      
      const balanceCheck = await checkSufficientBalance(
        userAddress,
        paymentInfo.deposit,
        gasEstimate
      );

      if (!balanceCheck.sufficient) {
        throw new Error(
          `Insufficient balance. You have ${balanceCheck.currentBalance.toFixed(4)} APT but need ${balanceCheck.required.toFixed(4)} APT (including gas)`
        );
      }

      console.log('🚀 Approving AutoPay:', {
        recipientAddress,
        emiId: createdEmiId,
        depositAmountOctas,
        depositAPT: paymentInfo.deposit
      });

      const result = await approveEmiAutoPay(
        account,
        recipientAddress,
        createdEmiId!,
        depositAmountOctas
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to activate autopay');
      }

      toast({
        title: "AutoPay Activated! ⚡",
        description: `Deposited ${paymentInfo.deposit} APT for autopay. Payments will be collected automatically.`,
        duration: 5000,
      });

      handleClose();
      onSuccess?.();

    } catch (err) {
      console.error('Error approving autopay:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate autopay';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      recipientIdentifier: '',
      monthlyAmount: '',
      durationMonths: '',
      initialDeposit: ''
    });
    setStep('setup');
    setCreatedEmiId(null);
    setRecipientWalletId('');
    setRecipientAddress('');
    setError('');
    onClose();
  };

  const paymentInfo = calculatePaymentInfo();

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
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-white">
            Set Up AutoPay {step === 'deposit' && '- Deposit Funds'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            {step === 'setup' 
              ? 'Create an automated recurring payment agreement'
              : 'Deposit funds to activate your autopay agreement'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div className={`flex items-center gap-2 ${step === 'setup' ? 'text-blue-400' : 'text-green-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'setup' ? 'bg-blue-600' : 'bg-green-600'
            }`}>
              {step === 'setup' ? '1' : <CheckCircle className="h-5 w-5" />}
            </div>
            <span className="text-sm font-medium">Setup</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600" />
          <div className={`flex items-center gap-2 ${step === 'deposit' ? 'text-blue-400' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'deposit' ? 'bg-blue-600' : 'bg-gray-800'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Deposit</span>
          </div>
        </div>

        {step === 'setup' ? (
          <form onSubmit={handleCreateAgreement} className="space-y-6 pb-4">
            {error && (
              <Alert className="bg-red-900/50 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="recipientIdentifier" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Recipient (Wallet ID, UPI ID, or Address)
              </Label>
              <Input
                id="recipientIdentifier"
                placeholder="testing1 or user@upi or 0x..."
                value={formData.recipientIdentifier}
                onChange={(e) => handleInputChange('recipientIdentifier', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 font-mono text-sm"
                disabled={isSubmitting}
              />
              {recipientWalletId && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-green-400">
                    Resolved to wallet: {recipientWalletId}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Enter wallet ID (e.g., testing1), UPI ID (e.g., user@upi), or wallet address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyAmount" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Payment Amount (APT)
              </Label>
              <Input
                id="monthlyAmount"
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={formData.monthlyAmount}
                onChange={(e) => handleInputChange('monthlyAmount', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">Amount to be paid monthly</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMonths" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Duration (Months)
              </Label>
              <Input
                id="durationMonths"
                type="number"
                min="1"
                max="60"
                placeholder="12"
                value={formData.durationMonths}
                onChange={(e) => handleInputChange('durationMonths', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">Number of monthly payments (max 60)</p>
            </div>

            {paymentInfo.monthlyAmount > 0 && paymentInfo.months > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Agreement Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Payment:</span>
                    <span className="text-white font-medium">{paymentInfo.monthlyAmount.toFixed(6)} APT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{paymentInfo.months} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Amount:</span>
                    <span className="text-white font-semibold">{paymentInfo.totalAmount.toFixed(6)} APT</span>
                  </div>
                  {recipientWalletId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recipient:</span>
                      <span className="text-white">{recipientWalletId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                disabled={isSubmitting || !recipientWalletId || !formData.monthlyAmount || !formData.durationMonths}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Create Agreement
                  </div>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleApproveAutoPay} className="space-y-6 pb-4">
            {error && (
              <Alert className="bg-red-900/50 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Agreement Created Successfully!</span>
              </div>
              <p className="text-xs text-gray-400">
                Your autopay agreement has been created. Now deposit funds to activate automatic payments.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialDeposit" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Initial Deposit (APT)
              </Label>
              <Input
                id="initialDeposit"
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={formData.initialDeposit}
                onChange={(e) => handleInputChange('initialDeposit', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Minimum: {paymentInfo.monthlyAmount.toFixed(6)} APT (one month's payment)
              </p>
              <p className="text-xs text-gray-400">
                💡 Tip: Deposit enough for multiple months to avoid running out of funds
              </p>
            </div>

            {paymentInfo.deposit > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Deposit Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deposit Amount:</span>
                    <span className="text-white font-medium">{paymentInfo.deposit.toFixed(6)} APT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Covers Months:</span>
                    <span className="text-white">
                      ~{Math.floor(paymentInfo.deposit / paymentInfo.monthlyAmount)} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Payment:</span>
                    <span className="text-white">{paymentInfo.monthlyAmount.toFixed(6)} APT</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('setup')}
                disabled={isSubmitting}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.initialDeposit || parseFloat(formData.initialDeposit) < paymentInfo.monthlyAmount}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Activating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Activate AutoPay
                  </div>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400">
            💡 <strong>How AutoPay Works:</strong> After setup, the recipient can collect monthly payments automatically from your deposited funds. You can add more funds anytime.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
