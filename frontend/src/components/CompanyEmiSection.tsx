import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2,
  Plus,
  Loader2,
  RefreshCw,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import {
  getEmiAgreement,
  createEmiAgreement,
  collectEmiPayment,
  octasToApt,
  aptToOctas,
  resolveRecipient,
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
import { Textarea } from "@/components/ui/textarea";

interface CompanyEmiSectionProps {
  companyAddress: string;
  account: Account | null;
}

export const CompanyEmiSection: React.FC<CompanyEmiSectionProps> = ({ companyAddress, account }) => {
  const [agreements, setAgreements] = useState<EmiAgreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Create EMI modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [recipientInput, setRecipientInput] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [recipientType, setRecipientType] = useState<'address' | 'wallet_id' | 'upi_id' | null>(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [months, setMonths] = useState('');
  const [firstPaymentDays, setFirstPaymentDays] = useState('30');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (companyAddress) {
      void loadCompanyAgreements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyAddress]);

  // Auto-resolve recipient
  useEffect(() => {
    const timer = setTimeout(() => {
      if (recipientInput.trim()) {
        void handleResolveRecipient();
      } else {
        setResolvedAddress(null);
        setRecipientType(null);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientInput]);

  const handleResolveRecipient = async () => {
    if (!recipientInput.trim()) return;

    setResolving(true);
    try {
      const result = await resolveRecipient(recipientInput.trim());
      if (result.address) {
        setResolvedAddress(result.address);
        setRecipientType(result.type);
      } else {
        setResolvedAddress(null);
        setRecipientType(null);
      }
    } catch (error) {
      console.error('Error resolving recipient:', error);
      setResolvedAddress(null);
      setRecipientType(null);
    } finally {
      setResolving(false);
    }
  };

  const loadCompanyAgreements = async () => {
    setLoading(true);
    try {
      // Load EMI IDs created by this company
      const storedEmiIds = localStorage.getItem(`company_emi_${companyAddress}`);
      
      if (storedEmiIds) {
        const emiIds: number[] = JSON.parse(storedEmiIds);
        const loadedAgreements: EmiAgreement[] = [];

        for (const emiId of emiIds) {
          const agreement = await getEmiAgreement(emiId);
          if (agreement && agreement.company === companyAddress) {
            loadedAgreements.push(agreement);
          }
        }

        setAgreements(loadedAgreements);
      } else {
        // Try loading first 20 EMI IDs as fallback
        const loadedAgreements: EmiAgreement[] = [];
        for (let i = 0; i < 20; i++) {
          const agreement = await getEmiAgreement(i);
          if (agreement && agreement.company === companyAddress) {
            loadedAgreements.push(agreement);
          }
        }
        setAgreements(loadedAgreements);
      }
    } catch (error) {
      console.error('Error loading company EMI agreements:', error);
      toast({
        title: "Error Loading Agreements",
        description: "Failed to load company EMI agreements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmi = async () => {
    if (!account || !resolvedAddress) {
      toast({
        title: "Invalid Recipient",
        description: "Please enter a valid recipient address, wallet ID, or UPI ID.",
        variant: "destructive",
      });
      return;
    }

    const total = parseFloat(totalAmount);
    const monthly = parseFloat(monthlyAmount);
    const numMonths = parseInt(months);
    const daysToFirstPayment = parseInt(firstPaymentDays);

    if (isNaN(total) || total <= 0) {
      toast({
        title: "Invalid Total Amount",
        description: "Please enter a valid total amount.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(monthly) || monthly <= 0) {
      toast({
        title: "Invalid Monthly Amount",
        description: "Please enter a valid monthly amount.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(numMonths) || numMonths < 1 || numMonths > 120) {
      toast({
        title: "Invalid Duration",
        description: "Please enter a valid number of months (1-120).",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(daysToFirstPayment) || daysToFirstPayment < 1) {
      toast({
        title: "Invalid First Payment Date",
        description: "Please enter a valid number of days.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Missing Description",
        description: "Please provide a description for the EMI agreement.",
        variant: "destructive",
      });
      return;
    }

    setProcessingId('creating');
    try {
      const totalOctas = aptToOctas(total).toString();
      const monthlyOctas = aptToOctas(monthly).toString();
      
      // Calculate first payment due timestamp (current time + days)
      const firstPaymentTimestamp = Math.floor(Date.now() / 1000) + (daysToFirstPayment * 24 * 60 * 60);

      const result = await createEmiAgreement(
        account,
        resolvedAddress,
        totalOctas,
        monthlyOctas,
        numMonths,
        firstPaymentTimestamp.toString(),
        description.trim()
      );

      if (result.success) {
        toast({
          title: "EMI Agreement Created! ✅",
          description: `Successfully created EMI agreement for ${total} APT over ${numMonths} months.`,
        });

        // Store the EMI ID (we'll assume it's the next available ID)
        const storedEmiIds = localStorage.getItem(`company_emi_${companyAddress}`);
        const emiIds: number[] = storedEmiIds ? JSON.parse(storedEmiIds) : [];
        const nextId = agreements.length > 0 
          ? Math.max(...agreements.map(a => parseInt(a.id))) + 1 
          : 0;
        emiIds.push(nextId);
        localStorage.setItem(`company_emi_${companyAddress}`, JSON.stringify(emiIds));

        // Also store in user's EMI list
        const userEmiIds = localStorage.getItem(`emi_agreements_${resolvedAddress}`);
        const userIds: number[] = userEmiIds ? JSON.parse(userEmiIds) : [];
        userIds.push(nextId);
        localStorage.setItem(`emi_agreements_${resolvedAddress}`, JSON.stringify(userIds));

        // Reset form
        setRecipientInput('');
        setResolvedAddress(null);
        setRecipientType(null);
        setTotalAmount('');
        setMonthlyAmount('');
        setMonths('');
        setFirstPaymentDays('30');
        setDescription('');
        setCreateModalOpen(false);

        await loadCompanyAgreements();
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error('Error creating EMI agreement:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create EMI agreement",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCollectPayment = async (agreement: EmiAgreement) => {
    if (!account) return;

    setProcessingId(agreement.id);
    try {
      const result = await collectEmiPayment(
        account,
        agreement.user,
        parseInt(agreement.id)
      );

      if (result.success) {
        const monthlyAmount = octasToApt(agreement.monthly_amount);
        toast({
          title: "Payment Collected! ✅",
          description: `Successfully collected ${monthlyAmount.toFixed(4)} APT from user.`,
        });
        await loadCompanyAgreements();
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error('Error collecting payment:', error);
      toast({
        title: "Collection Failed",
        description: error instanceof Error ? error.message : "Failed to collect payment",
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

  const canCollectPayment = (agreement: EmiAgreement) => {
    const now = Math.floor(Date.now() / 1000);
    const dueDate = parseInt(agreement.next_payment_due);
    return agreement.status === 0 && 
           agreement.auto_pay_approved && 
           now >= dueDate &&
           agreement.months_paid < agreement.months;
  };

  const getRecipientTypeBadge = (type: 'address' | 'wallet_id' | 'upi_id' | null) => {
    if (!type) return null;
    
    const colors = {
      address: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      wallet_id: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      upi_id: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    const labels = {
      address: 'Address',
      wallet_id: 'Wallet ID',
      upi_id: 'UPI ID',
    };

    return (
      <Badge className={colors[type]}>
        {labels[type]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            Company EMI Management
          </h2>
          <p className="text-muted-foreground mt-1">Create and manage EMI agreements</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create EMI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create EMI Agreement</DialogTitle>
                <DialogDescription>
                  Create a new EMI agreement for a user to pay in installments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Recipient */}
                <div className="space-y-2">
                  <Label htmlFor="recipient">User (Address / Wallet ID / UPI ID)</Label>
                  <Input
                    id="recipient"
                    placeholder="0x... or wallet_id or user@provider"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                  />
                  {resolving && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Resolving...
                    </p>
                  )}
                  {resolvedAddress && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-green-400">✓ Resolved</p>
                        {getRecipientTypeBadge(recipientType)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {resolvedAddress}
                      </p>
                    </div>
                  )}
                  {recipientInput && !resolving && !resolvedAddress && (
                    <p className="text-xs text-red-400">✗ Invalid recipient</p>
                  )}
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Amount (APT)</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyAmount">Monthly Amount (APT)</Label>
                    <Input
                      id="monthlyAmount"
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="months">Number of Months</Label>
                    <Input
                      id="months"
                      type="number"
                      min="1"
                      max="120"
                      placeholder="12"
                      value={months}
                      onChange={(e) => setMonths(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstPayment">Days to First Payment</Label>
                    <Input
                      id="firstPayment"
                      type="number"
                      min="1"
                      placeholder="30"
                      value={firstPaymentDays}
                      onChange={(e) => setFirstPaymentDays(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Laptop purchase - Model XYZ123"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => void handleCreateEmi()}
                  disabled={!resolvedAddress || processingId === 'creating'}
                >
                  {processingId === 'creating' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create EMI Agreement</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="icon"
            onClick={() => void loadCompanyAgreements()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agreements</p>
                <p className="text-2xl font-bold text-foreground">{agreements.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agreements</p>
                <p className="text-2xl font-bold text-foreground">
                  {agreements.filter(a => a.status === 0).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Collections</p>
                <p className="text-2xl font-bold text-foreground">
                  {agreements.filter(a => canCollectPayment(a)).length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreements List */}
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
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No EMI Agreements</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Create EMI agreements to allow users to pay for purchases in monthly installments.
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
            const canCollect = canCollectPayment(agreement);

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
                          {canCollect && (
                            <Badge className="bg-primary/20 text-primary border-primary/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Ready to Collect
                            </Badge>
                          )}
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

                    {/* Auto-Pay Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Auto-Pay</p>
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
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Balance</p>
                          <p className="text-foreground font-medium">{autoPayBalance.toFixed(4)} APT</p>
                        </div>
                      )}
                    </div>

                    {/* Next Payment Due */}
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/20 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Next Payment:</span>
                      <span className="text-foreground font-medium">
                        {formatDate(agreement.next_payment_due)}
                      </span>
                    </div>

                    {/* Collect Payment Button */}
                    {canCollect && (
                      <Button
                        className="w-full"
                        onClick={() => void handleCollectPayment(agreement)}
                        disabled={!account || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Collecting...
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Collect Payment ({monthlyAmount.toFixed(4)} APT)
                          </>
                        )}
                      </Button>
                    )}

                    {/* User Info */}
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">User Address</p>
                      <p className="text-xs text-foreground font-mono break-all">
                        {agreement.user}
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
