import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, RefreshCw, Wallet, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface WalletInfoProps {
  address: string;
  balance?: string;
  network: string;
  isConnected: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
}

const WalletInfo: React.FC<WalletInfoProps> = ({
  address,
  balance,
  network,
  isConnected,
  onRefresh,
  onDisconnect
}) => {
  const [showBalance, setShowBalance] = useState(true);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatBalance = (bal?: string) => {
    if (!bal) return '0.00000000 ETH';
    return `${parseFloat(bal).toFixed(8)} ETH`;
  };

  const formatFiatValue = (bal?: string) => {
    if (!bal) return '≈ ₹0.00';
    return `≈ ₹${(parseFloat(bal) * 251100).toFixed(2)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Information
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant="outline">{network}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Balance</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="h-8 w-8 p-0"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900">
              {showBalance ? formatBalance(balance) : '••••••••'}
            </div>
            <div className="text-sm text-gray-600">
              {showBalance ? formatFiatValue(balance) : '••••••'}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Wallet Address</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(address)}
                className="h-8 w-8 p-0"
                title="Copy Address"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="View on Explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border">
            <code className="text-sm font-mono text-gray-800 break-all">{address}</code>
          </div>
        </div>

        {/* Network Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Network</div>
            <div className="text-sm font-medium text-gray-900 mt-1 capitalize">{network}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</div>
            <div className="text-sm font-medium text-gray-900 mt-1">
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex-1 h-10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Balance
          </Button>
          <Button
            variant="destructive"
            onClick={onDisconnect}
            className="flex-1 h-10"
          >
            Disconnect Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletInfo;