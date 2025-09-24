import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, EyeOff, Eye, Copy, Send, QrCode, ArrowUpDown, History } from 'lucide-react';

interface Transaction {
  version: string;
  timestamp: string;
  type: string;
  success: boolean;
  hash?: string;
}

interface WalletSectionProps {
  currentAccount: any;
  balance: string;
  showBalance: boolean;
  transactions: Transaction[];
  onToggleBalance: () => void;
  onCopyAddress: (address: string) => void;
  onSendTransaction: () => void;
  onShowReceiveQR: () => void;
  onViewTransactions: () => void;
}

export const WalletSection: React.FC<WalletSectionProps> = ({
  currentAccount,
  balance,
  showBalance,
  transactions,
  onToggleBalance,
  onCopyAddress,
  onSendTransaction,
  onShowReceiveQR,
  onViewTransactions
}) => {
  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet Balance
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleBalance}
              className="hover:bg-muted/50"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-foreground">
                {showBalance ? `${parseFloat(balance || '0').toFixed(8)} APT` : '••••••••'}
              </div>
              <div className="text-muted-foreground">
                {showBalance ? `≈ ₹${(parseFloat(balance || '0') * 251100).toFixed(2)}` : '••••••'}
              </div>
            </div>
            
            {currentAccount?.address && (
              <div className="bg-muted/20 backdrop-blur-sm rounded-lg p-4 space-y-2 border border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Address</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyAddress(currentAccount.address)}
                    className="h-6 w-6 p-0 hover:bg-muted/50"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-mono text-sm text-muted-foreground break-all">{currentAccount.address}</div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cosmic-glow" 
                onClick={onSendTransaction}
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-border hover:bg-muted/50 cosmic-glow" 
                onClick={onShowReceiveQR}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Receive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 cosmic-glow bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30" onClick={onSendTransaction}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Send className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium text-foreground">Send APT</div>
              <div className="text-sm text-muted-foreground">Transfer to others</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 cosmic-glow bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30" onClick={onShowReceiveQR}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <QrCode className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium text-foreground">Receive</div>
              <div className="text-sm text-muted-foreground">Show QR code</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 cosmic-glow bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30" onClick={onViewTransactions}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <History className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium text-foreground">History</div>
              <div className="text-sm text-muted-foreground">View transactions</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Preview */}
      <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewTransactions}
              className="border-border hover:bg-muted/50 cosmic-glow"
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 3).map((tx: Transaction, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <ArrowUpDown className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {tx.type?.includes('transfer') ? 'Transfer' : 'Transaction'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(parseInt(tx.timestamp) / 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {tx.version || 'N/A'}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tx.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Recent Transactions</h3>
              <p className="text-muted-foreground mb-4">
                Your transaction history will appear here
              </p>
              <Button
                variant="outline"
                onClick={onSendTransaction}
                className="border-border hover:bg-muted/50"
              >
                Send Your First Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};