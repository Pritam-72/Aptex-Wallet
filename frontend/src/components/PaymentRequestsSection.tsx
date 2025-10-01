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
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Payment Request interface for type safety
interface PaymentRequest {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  description?: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
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
  const [incomingRequests, setIncomingRequests] = useState<PaymentRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<PaymentRequest[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const { toast } = useToast();

  // Load requests - Feature disabled
  const loadRequests = () => {
    // Payment requests feature requires backend/smart contract
    setIncomingRequests([]);
    setOutgoingRequests([]);
  };

  useEffect(() => {
    loadRequests();
  }, [userAddress]);

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      toast({
        title: "Feature Coming Soon",
        description: "Payment requests require backend/smart contract implementation",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      toast({
        title: "Feature Coming Soon",
        description: "Payment requests require backend/smart contract implementation",
        variant: "destructive",
        duration: 3000,
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
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'accepted': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
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
            Outgoing ({outgoingRequests.filter(req => req.status === 'pending').length})
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

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={processingRequest === request.id}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingRequest === request.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

                  {request.status === 'accepted' && request.txHash && (
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                      <div className="text-sm text-green-300">
                        ✅ Payment sent successfully
                      </div>
                      <div className="text-xs text-green-400 font-mono mt-1">
                        TX: {request.txHash.slice(0, 12)}...{request.txHash.slice(-8)}
                      </div>
                    </div>
                  )}

                  {request.status === 'rejected' && (
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

                  {request.status === 'accepted' && request.txHash && (
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mt-3">
                      <div className="text-sm text-green-300">
                        ✅ Request accepted and payment received
                      </div>
                      <div className="text-xs text-green-400 font-mono mt-1">
                        TX: {request.txHash.slice(0, 12)}...{request.txHash.slice(-8)}
                      </div>
                    </div>
                  )}

                  {request.status === 'rejected' && (
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