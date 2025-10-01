import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HandCoins, 
  Clock, 
  User, 
  DollarSign, 
  MessageSquare, 
  Check, 
  X, 
  Send,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getPaymentRequest,
  payRequest,
  rejectRequest,
  getAccountFromPrivateKey,
  octasToApt,
  aptToOctas,
  checkSufficientBalance,
  aptos,
  PaymentRequest as ContractPaymentRequest
} from '@/utils/contractUtils';

// Payment Request interface for display
interface DisplayPaymentRequest {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string; // in APT
  description: string;
  timestamp: Date;
  status: 'Pending' | 'Paid' | 'Rejected';
  txHash?: string;
}

interface PaymentRequestsSectionProps {
  userAddress: string;
  onSendRequest: () => void;
  onBalanceUpdate?: () => void;
}

export const PaymentRequestsSection: React.FC<PaymentRequestsSectionProps> = ({
  userAddress,
  onSendRequest,
  onBalanceUpdate
}) => {
  const [incomingRequests, setIncomingRequests] = useState<DisplayPaymentRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<DisplayPaymentRequest[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load payment requests from blockchain
  const loadRequests = async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      const incoming: DisplayPaymentRequest[] = [];
      const outgoing: DisplayPaymentRequest[] = [];

      // OPTIMIZED: Reduced limit and added early exit
      let consecutiveNotFound = 0;
      const MAX_CONSECUTIVE_NOT_FOUND = 3;
      
      for (let i = 0; i < 30; i++) { // Reduced from 50 to 30
        try {
          const requestData = await getPaymentRequest(i);
          
          if (!requestData) {
            consecutiveNotFound++;
            if (consecutiveNotFound >= MAX_CONSECUTIVE_NOT_FOUND) {
              break; // Stop after 3 consecutive not found
            }
            continue;
          }
          consecutiveNotFound = 0; // Reset counter
          
          // Convert status number to string
          let status: 'Pending' | 'Paid' | 'Rejected' = 'Pending';
          if (requestData.status === 1) status = 'Paid';
          else if (requestData.status === 2) status = 'Rejected';

          const request: DisplayPaymentRequest = {
            id: requestData.id,
            fromAddress: requestData.from_address,
            toAddress: requestData.to_address,
            amount: octasToApt(requestData.amount).toFixed(8),
            description: requestData.description,
            timestamp: new Date(parseInt(requestData.created_at) / 1000), // Convert microseconds to milliseconds
            status,
            txHash: status === 'Paid' ? 'Transaction completed' : undefined
          };

          // Categorize: incoming if user is to_address, outgoing if user is from_address
          if (requestData.to_address.toLowerCase() === userAddress.toLowerCase()) {
            incoming.push(request);
          } else if (requestData.from_address.toLowerCase() === userAddress.toLowerCase()) {
            outgoing.push(request);
          }
        } catch (err) {
          // Stop when we hit an error (likely means no more requests)
          break;
        }
      }

      setIncomingRequests(incoming.reverse()); // Most recent first
      setOutgoingRequests(outgoing.reverse());
      
    } catch (error) {
      console.error('Error loading payment requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      // Get wallet data
      const storedWallet = localStorage.getItem('aptosWallet');
      if (!storedWallet) {
        toast({
          title: "Wallet Not Found",
          description: "Please create or import a wallet first.",
          variant: "destructive",
        });
        return;
      }

      const walletData = JSON.parse(storedWallet);
      const account = getAccountFromPrivateKey(walletData.privateKey);

      // Get request data to check amount
      const request = incomingRequests.find(r => r.id === requestId);
      if (!request) return;

      const amountAPT = parseFloat(request.amount);
      const amountInOctas = aptToOctas(amountAPT);

      // Check balance (including 0.0002 APT for gas)
      const gasEstimateAPT = 0.0002;
      const balanceCheck = await checkSufficientBalance(userAddress, amountAPT, gasEstimateAPT);
      if (!balanceCheck.sufficient) {
        toast({
          title: "Insufficient Balance",
          description: `You need at least ${request.amount} APT plus gas fees (~0.0002 APT).`,
          variant: "destructive",
        });
        return;
      }

      // Pay the request on-chain
      const result = await payRequest(account, parseInt(requestId));

      toast({
        title: "Payment Sent!",
        description: `Successfully paid ${request.amount} APT.`,
      });

      // Reload requests
      await loadRequests();
      
      // Notify parent to update balance
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
    } catch (error) {
      console.error('Error accepting payment request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to pay request';
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      // Get wallet data
      const storedWallet = localStorage.getItem('aptosWallet');
      if (!storedWallet) {
        toast({
          title: "Wallet Not Found",
          description: "Please create or import a wallet first.",
          variant: "destructive",
        });
        return;
      }

      const walletData = JSON.parse(storedWallet);
      const account = getAccountFromPrivateKey(walletData.privateKey);

      // Reject the request on-chain
      await rejectRequest(account, parseInt(requestId));

      toast({
        title: "Request Rejected",
        description: "You have rejected the payment request.",
      });

      // Reload requests
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting payment request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
      toast({
        title: "Rejection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Paid': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <HandCoins className="h-5 w-5 text-primary" />
            Payment Requests
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRequests}
              className="hover:bg-muted/50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={onSendRequest}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tab Navigation */}
        <div className="flex bg-muted/20 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'incoming'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <HandCoins className="h-4 w-4" />
            Incoming ({incomingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'outgoing'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Send className="h-4 w-4" />
            Outgoing ({outgoingRequests.filter(req => req.status === 'Pending').length})
          </button>
        </div>

        {/* Incoming Requests */}
        {activeTab === 'incoming' && (
          <div className="space-y-3">
            {incomingRequests.length > 0 ? (
              incomingRequests.map((request) => (
                <div key={request.id} className="bg-muted/10 rounded-lg p-4 border border-border/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          Payment Request
                        </div>
                        <div className="text-sm text-muted-foreground">
                          From: {formatAddress(request.fromAddress)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {request.amount} APT
                      </span>
                      <span className="text-muted-foreground">
                        (≈ ₹{(parseFloat(request.amount) * 373).toFixed(2)})
                      </span>
                    </div>
                    
                    {request.description && (
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                        <span className="text-muted-foreground">{request.description}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDate(request.timestamp)}
                    </div>
                  </div>

                  {request.status === 'Pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={processingRequest === request.id}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingRequest === request.id ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Accept & Pay
                          </div>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequest === request.id}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.status === 'Paid' && request.txHash && (
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                      <div className="text-sm text-green-300">
                        ✅ Payment sent successfully
                      </div>
                      <div className="text-xs text-green-400 font-mono mt-1">
                        TX: {request.txHash.slice(0, 12)}...{request.txHash.slice(-8)}
                      </div>
                    </div>
                  )}

                  {request.status === 'Rejected' && (
                    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                      <div className="text-sm text-red-300">
                        ❌ Request rejected
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <HandCoins className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Payment Requests</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any incoming payment requests
                </p>
              </div>
            )}
          </div>
        )}

        {/* Outgoing Requests */}
        {activeTab === 'outgoing' && (
          <div className="space-y-3">
            {outgoingRequests.length > 0 ? (
              outgoingRequests.map((request) => (
                <div key={request.id} className="bg-muted/10 rounded-lg p-4 border border-border/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-orange-600/10 rounded-full flex items-center justify-center">
                        <Send className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          Sent Request
                        </div>
                        <div className="text-sm text-muted-foreground">
                          To: {formatAddress(request.toAddress)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {request.amount} APT
                      </span>
                      <span className="text-muted-foreground">
                        (≈ ₹{(parseFloat(request.amount) * 373).toFixed(2)})
                      </span>
                    </div>
                    
                    {request.description && (
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                        <span className="text-muted-foreground">{request.description}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDate(request.timestamp)}
                    </div>
                  </div>

                  {request.status === 'Paid' && request.txHash && (
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mt-3">
                      <div className="text-sm text-green-300">
                        ✅ Request accepted and payment received
                      </div>
                      <div className="text-xs text-green-400 font-mono mt-1">
                        TX: {request.txHash.slice(0, 12)}...{request.txHash.slice(-8)}
                      </div>
                    </div>
                  )}

                  {request.status === 'Rejected' && (
                    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mt-3">
                      <div className="text-sm text-red-300">
                        ❌ Request was rejected
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Send className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Sent Requests</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't sent any payment requests yet
                </p>
                <Button
                  onClick={onSendRequest}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Your First Request
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};