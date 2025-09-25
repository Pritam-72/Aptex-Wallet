import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  History, 
  Shield, 
  CheckCircle, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  User
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface WalletDetailsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletDetails: React.FC<WalletDetailsProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    address, 
    balance, 
    walletId, 
    transactions, 
    identityVerified 
  } = useWallet();

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount?: string) => {
    if (!amount) return 'N/A';
    return `${parseFloat(amount).toFixed(4)} APT`;
  };

  const formatAddress = (addr?: string) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="h-4 w-4 text-red-400" />;
      case 'receive':
        return <ArrowDownLeft className="h-4 w-4 text-green-400" />;
      case 'register_id':
        return <User className="h-4 w-4 text-blue-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-black/95 backdrop-blur-sm border-white/10 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            Wallet Details
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Complete wallet information and transaction history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Wallet Overview */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Address</label>
                  <p className="text-white font-mono text-sm break-all">
                    {address || 'Not connected'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Balance</label>
                  <p className="text-white text-lg font-semibold">
                    {balance} APT
                  </p>
                  <p className="text-gray-400 text-sm">
                    ≈ ₹{(parseFloat(balance || '0') * 5019.44).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Wallet ID</label>
                  <p className="text-white">
                    {walletId || 'Not registered'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Identity Status</label>
                  <div className="flex items-center gap-2">
                    {identityVerified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-green-400">Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span className="text-red-400">Not Verified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {transactions.length} transactions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No transactions found
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx, index) => (
                    <div 
                      key={tx.hash} 
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium capitalize">
                              {tx.type === 'register_id' ? 'Wallet ID Registration' : tx.type}
                            </span>
                            {getStatusBadge(tx.status)}
                          </div>
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>Hash: {formatAddress(tx.hash)}</p>
                            <p>{formatTimestamp(tx.timestamp)}</p>
                            {tx.to && <p>To: {formatAddress(tx.to)}</p>}
                            {tx.from && <p>From: {formatAddress(tx.from)}</p>}
                            {tx.walletId && <p>Wallet ID: {tx.walletId}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {tx.amount && (
                          <>
                            <p className={`font-semibold ${
                              tx.type === 'send' ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {tx.type === 'send' ? '-' : '+'}{formatAmount(tx.amount)}
                            </p>
                            <p className="text-xs text-gray-400">
                              ≈ ₹{(parseFloat(tx.amount) * 5019.44).toFixed(2)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {transactions.length > 10 && (
                    <p className="text-center text-gray-400 text-sm py-2">
                      Showing 10 of {transactions.length} transactions
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Identity Verification</span>
                  {identityVerified ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span>Enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-4 w-4" />
                      <span>Disabled</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Wallet ID Registration</span>
                  {walletId ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span>Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-4 w-4" />
                      <span>Not Registered</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Local Storage Backup</span>
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onClose}
            className="bg-white hover:bg-gray-100 text-black font-medium"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};