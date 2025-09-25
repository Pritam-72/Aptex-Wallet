import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GridPatternCard, GridPatternCardBody } from '@/components/ui/card-with-grid-ellipsis-pattern';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { 
  CreditCard, 
  Calendar, 
  Wallet, 
  Clock, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Zap,
  Settings,
  User,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AutoPaySectionProps {
  userAddress: string;
}

interface AutoPaySetup {
  recipientAddress: string;
  amount: string;
  durationMonths: string;
  startDate: string;
}

interface AutoPayRecord {
  id: string;
  fromAddress: string;
  toAddress: string;
  monthlyAmount: string;
  totalAmount: string;
  durationMonths: number;
  startDate: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  nextPaymentDate: string;
  paymentsCompleted: number;
}

export const AutoPaySection: React.FC<AutoPaySectionProps> = ({ userAddress }) => {
  const [formData, setFormData] = useState<AutoPaySetup>({
    recipientAddress: '',
    amount: '',
    durationMonths: '',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoPays, setAutoPays] = useState<AutoPayRecord[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  // Animation trigger
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load existing autopays on component mount
  React.useEffect(() => {
    loadAutoPays();
  }, [userAddress]);

  const loadAutoPays = () => {
    const existingAutoPays = JSON.parse(localStorage.getItem(`autopay_${userAddress}`) || '[]');
    setAutoPays(existingAutoPays);
  };

  // Handle form field changes
  const handleInputChange = (field: keyof AutoPaySetup, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  // Validate form
  const validateForm = () => {
    setError('');

    if (!formData.recipientAddress.trim()) {
      setError('Recipient address is required');
      return false;
    }

    if (!formData.recipientAddress.startsWith('0x') || formData.recipientAddress.length < 10) {
      setError('Invalid recipient address format');
      return false;
    }

    if (formData.recipientAddress === userAddress) {
      setError('Cannot set up autopay to your own address');
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
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

    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }

    const startDate = new Date(formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      setError('Start date cannot be in the past');
      return false;
    }

    return true;
  };

  // Calculate total amount and monthly payment
  const calculatePaymentInfo = () => {
    const monthlyAmount = parseFloat(formData.amount) || 0;
    const months = parseInt(formData.durationMonths) || 0;
    const totalAmount = monthlyAmount * months;

    return {
      monthlyAmount,
      totalAmount,
      months
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const paymentInfo = calculatePaymentInfo();
      
      const autoPayId = `autopay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const autoPaySetup: AutoPayRecord = {
        id: autoPayId,
        fromAddress: userAddress,
        toAddress: formData.recipientAddress,
        monthlyAmount: formData.amount,
        totalAmount: paymentInfo.totalAmount.toString(),
        durationMonths: parseInt(formData.durationMonths),
        startDate: formData.startDate,
        status: 'active',
        createdAt: new Date().toISOString(),
        nextPaymentDate: formData.startDate,
        paymentsCompleted: 0
      };

      const existingAutoPays = JSON.parse(localStorage.getItem(`autopay_${userAddress}`) || '[]');
      existingAutoPays.push(autoPaySetup);
      localStorage.setItem(`autopay_${userAddress}`, JSON.stringify(existingAutoPays));

      setAutoPays(existingAutoPays);

      toast({
        title: "AutoPay Setup Complete! ⚡",
        description: `Monthly payment of ${formData.amount} APT set up for ${formData.durationMonths} months`,
        duration: 5000,
      });

      setFormData({
        recipientAddress: '',
        amount: '',
        durationMonths: '',
        startDate: new Date().toISOString().split('T')[0]
      });

    } catch (error: any) {
      console.error('Error setting up autopay:', error);
      setError('Failed to set up autopay. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel autopay
  const cancelAutoPay = (id: string) => {
    const updatedAutoPays = autoPays.map(ap => 
      ap.id === id ? { ...ap, status: 'paused' as const } : ap
    );
    setAutoPays(updatedAutoPays);
    localStorage.setItem(`autopay_${userAddress}`, JSON.stringify(updatedAutoPays));
    
    toast({
      title: "AutoPay Paused",
      description: "AutoPay has been paused successfully",
      duration: 3000,
    });
  };

  const paymentInfo = calculatePaymentInfo();

  return (
    <div className="w-full bg-black text-white min-h-screen p-6">
      {/* Simple Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
            <Zap className="h-4 w-4 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white">AutoPay</h1>
        </div>
        <p className="text-gray-400 text-lg">Automate recurring payments with smart contracts</p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Setup Form */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Create New AutoPay</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm mb-2 block">Recipient Address</Label>
                <Input
                  placeholder="0x1234567890abcdef..."
                  value={formData.recipientAddress}
                  onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 font-mono text-sm h-11"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">Amount (APT)</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 h-11"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">Duration (Months)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="12"
                    value={formData.durationMonths}
                    onChange={(e) => handleInputChange('durationMonths', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 h-11"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white h-11"
                    disabled={isSubmitting}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            {paymentInfo.monthlyAmount > 0 && paymentInfo.months > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-white font-medium">{paymentInfo.totalAmount.toFixed(6)} APT</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !formData.recipientAddress || !formData.amount || !formData.durationMonths}
              className="w-full bg-white text-black hover:bg-gray-200 h-11 font-medium"
            >
              {isSubmitting ? "Creating..." : "Create AutoPay"}
            </Button>
          </form>
        </div>

        {/* Active AutoPays */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            Active AutoPays ({autoPays.filter(ap => ap.status === 'active').length})
          </h2>

          <div className="space-y-4">
            {autoPays.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="mb-2">No AutoPays set up yet</p>
                <p className="text-sm">Create your first automated payment above</p>
              </div>
            ) : (
              autoPays.map((autoPay) => (
                <div
                  key={autoPay.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">To:</div>
                      <div className="text-white font-mono text-sm mb-2">
                        {autoPay.toAddress.slice(0, 10)}...{autoPay.toAddress.slice(-6)}
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {autoPay.monthlyAmount} APT/month
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        autoPay.status === 'active' 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {autoPay.status}
                      </span>
                      {autoPay.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelAutoPay(autoPay.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 mb-1">Duration</div>
                      <div className="text-white">{autoPay.durationMonths} months</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Progress</div>
                      <div className="text-white">
                        {autoPay.paymentsCompleted}/{autoPay.durationMonths}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Next Payment</div>
                      <div className="text-white">{autoPay.nextPaymentDate}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Total</div>
                      <div className="text-white">{autoPay.totalAmount} APT</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};