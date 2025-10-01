import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  RefreshCw,
  Plus,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import {
  getEmiAgreement,
  approveEmiAutoPay,
  addEmiFunds,
  octasToApt,
  aptToOctas,
  EmiAgreement,
} from '@/utils/contractUtils';
import { Account } from "@aptos-labs/ts-sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmiAgreementsSectionProps {
  userAddress: string;
  account: Account | null;
}

export const EmiAgreementsSection: React.FC<EmiAgreementsSectionProps> = ({ userAddress, account }) => {
  const [agreements, setAgreements] = useState<EmiAgreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [addFundsModalOpen, setAddFundsModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<EmiAgreement | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    if (userAddress) {
      void loadAgreements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  const loadAgreements = async () => {
    setLoading(true);
    try {
      // Try loading EMI IDs from localStorage (companies would store this)
      const storedEmiIds = localStorage.getItem(`emi_agreements_${userAddress}`);
      
      if (storedEmiIds) {
        const emiIds: number[] = JSON.parse(storedEmiIds);
        const loadedAgreements: EmiAgreement[] = [];

        for (const emiId of emiIds) {
          const agreement = await getEmiAgreement(emiId);
          if (agreement && agreement.user === userAddress) {
            loadedAgreements.push(agreement);
          }
        }

        setAgreements(loadedAgreements);
      } else {
        // Try loading first 10 EMI IDs as fallback
        const loadedAgreements: EmiAgreement[] = [];
        for (let i = 0; i < 10; i++) {
          const agreement = await getEmiAgreement(i);
          if (agreement && agreement.user === userAddress) {
            loadedAgreements.push(agreement);
          }
        }
        setAgreements(loadedAgreements);
      }
    } catch (error) {
      console.error('Error loading EMI agreements:', error);
      toast({
        title: "Error Loading Agreements",
        description: "Failed to load your EMI agreements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAutoPay = async () => {
    if (!account || !selectedAgreement) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(selectedAgreement.id);
    try {
      const amountInOctas = aptToOctas(amount).toString();
      const result = await approveEmiAutoPay(
        account,
        selectedAgreement.company,
        parseInt(selectedAgreement.id),
        amountInOctas
      );

      if (result.success) {
        toast({
          title: "Auto-Pay Approved! ✅",
          description: `Successfully approved auto-pay with ${amount} APT deposit.`,
        });
        setApproveModalOpen(false);
        setDepositAmount('');
        await loadAgreements();
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error('Error approving auto-pay:', error);
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve auto-pay",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddFunds = async () => {
    if (!account || !selectedAgreement) return;

    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(selectedAgreement.id);
    try {
      const amountInOctas = aptToOctas(amount).toString();
      const result = await addEmiFunds(
        account,
        selectedAgreement.company,
        parseInt(selectedAgreement.id),
        amountInOctas
      );

      if (result.success) {
        toast({
          title: "Funds Added! ✅",
          description: `Successfully added ${amount} APT to your EMI account.`,
        });
        setAddFundsModalOpen(false);
        setAddAmount('');
        await loadAgreements();
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast({
        title: "Failed to Add Funds",
        description: error instanceof Error ? error.message : "Failed to add funds",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle };
      case 1:
        return { label: 'Completed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle };
      case 2:
        return { label: 'Defaulted', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle };
      default:
        return { label: 'Unknown', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertCircle };
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateProgress = (monthsPaid: number, totalMonths: number) => {
    return (monthsPaid / totalMonths) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
            EMI Agreements
          </h2>
          <p className="text-muted-foreground mt-1">Manage your installment payments</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadAgreements()}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {loading && agreements.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading EMI agreements...</p>
          </CardContent>
        </Card>
      ) : agreements.length === 0 ? (
        <Card className="bg-card/50 border-border/50 cosmic-glow">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No EMI Agreements</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have any EMI agreements yet. Companies can create EMI agreements for purchases.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agreements.map((agreement, index) => {
            const statusInfo = getStatusInfo(agreement.status);
            const StatusIcon = statusInfo.icon;
            const progress = calculateProgress(agreement.months_paid, agreement.months);
            const totalAmount = octasToApt(agreement.total_amount);
            const monthlyAmount = octasToApt(agreement.monthly_amount);
            const autoPayBalance = octasToApt(agreement.auto_pay_balance);
            const isProcessing = processingId === agreement.id;

            return (
              <motion.div
                key={agreement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 border-border/50 cosmic-glow hover:border-primary/30 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          EMI #{agreement.id}
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {agreement.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Payment Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground font-medium">
                          {agreement.months_paid} / {agreement.months} months
                        </span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="text-foreground font-medium">{totalAmount.toFixed(4)} APT</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Monthly Payment</p>
                        <p className="text-foreground font-medium">{monthlyAmount.toFixed(4)} APT</p>
                      </div>
                    </div>

                    {/* Next Payment Due */}
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/20 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Next Payment:</span>
                      <span className="text-foreground font-medium">
                        {formatDate(agreement.next_payment_due)}
                      </span>
                    </div>

                    {/* Auto-Pay Status */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Auto-Pay</span>
                        <Badge
                          className={
                            agreement.auto_pay_approved
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }
                        >
                          {agreement.auto_pay_approved ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      {agreement.auto_pay_approved && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Balance: </span>
                          <span className="text-foreground font-medium">
                            {autoPayBalance.toFixed(4)} APT
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {agreement.status === 0 && (
                      <div className="flex gap-2 pt-2">
                        {!agreement.auto_pay_approved ? (
                          <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
                            <DialogTrigger asChild>
                              <Button
                                className="flex-1"
                                onClick={() => setSelectedAgreement(agreement)}
                                disabled={!account || isProcessing}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Auto-Pay
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Auto-Pay</DialogTitle>
                                <DialogDescription>
                                  Deposit funds to enable automatic monthly payments for EMI #{agreement.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="deposit">Initial Deposit Amount (APT)</Label>
                                  <Input
                                    id="deposit"
                                    type="number"
                                    step="0.0001"
                                    placeholder="0.0000"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Recommended: At least {monthlyAmount.toFixed(4)} APT for first payment
                                  </p>
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => void handleApproveAutoPay()}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>Approve Auto-Pay</>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Dialog open={addFundsModalOpen} onOpenChange={setAddFundsModalOpen}>
                            <DialogTrigger asChild>
                              <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => setSelectedAgreement(agreement)}
                                disabled={!account || isProcessing}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Funds
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Funds to EMI Auto-Pay</DialogTitle>
                                <DialogDescription>
                                  Add more funds to your auto-pay account for EMI #{agreement.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="p-3 bg-muted/20 rounded-lg space-y-1">
                                  <p className="text-sm text-muted-foreground">Current Balance</p>
                                  <p className="text-lg font-bold text-foreground">
                                    {autoPayBalance.toFixed(4)} APT
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="addAmount">Amount to Add (APT)</Label>
                                  <Input
                                    id="addAmount"
                                    type="number"
                                    step="0.0001"
                                    placeholder="0.0000"
                                    value={addAmount}
                                    onChange={(e) => setAddAmount(e.target.value)}
                                  />
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => void handleAddFunds()}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>Add Funds</>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    )}

                    {/* Company Info */}
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">Company Address</p>
                      <p className="text-xs text-foreground font-mono break-all">
                        {agreement.company}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
