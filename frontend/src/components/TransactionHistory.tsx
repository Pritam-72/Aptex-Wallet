import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Search, Filter, ExternalLink, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { getAccountTransactions, ProcessedTransaction } from '@/utils/aptosWalletUtils';
import * as XLSX from 'xlsx';

// Updated transaction interface to match real Aptos transactions
interface PaymentTransaction {
  from: string;
  to: string;
  ethAmount: string; // Keep same field names for compatibility
  aptosAmount: string;
  inrAmount: number;
  timestamp: Date;
  txHash?: string;
  type: 'sent' | 'received' | 'other';
  status: 'confirmed' | 'failed';
  gasUsed?: string;
  function?: string;
}

export const TransactionHistory: React.FC<{ refreshFlag?: number }> = ({ refreshFlag }) => {
  const { address, isConnected } = useWallet();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock APT to INR conversion (1 APT = 1000 INR for demo)
  const convertAPTToINR = (aptAmount: string): number => {
    return parseFloat(aptAmount) * 373;
  };

  const loadTransactions = useCallback(async (refresh = false) => {
    if (!isConnected || !address) return;

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('🔍 Loading real transaction history for:', address);
      
      // Fetch real transactions from Aptos devnet
      const aptosTransactions = await getAccountTransactions(address, 50);
      
      // Convert to our PaymentTransaction format
      const convertedTransactions: PaymentTransaction[] = aptosTransactions.map((tx): PaymentTransaction => {
        // Determine the proper type for UI display
        let displayType: 'sent' | 'received' | 'other' = tx.type;
        
        // For contract interactions or unknown types, keep as 'other'
        if (tx.type === 'other' && tx.function && !tx.function.includes('Transfer')) {
          displayType = 'other';
        } else if (tx.type === 'other') {
          // If it's 'other' but no specific function, treat as 'sent' (likely gas fee)
          displayType = 'sent';
        }
        
        return {
          from: tx.from,
          to: tx.to,
          ethAmount: tx.amount, // Using same field name for compatibility
          inrAmount: convertAPTToINR(tx.amount),
          timestamp: tx.timestamp,
          txHash: tx.hash,
          type: displayType,
          status: tx.status,
          gasUsed: tx.gasUsed,
          function: tx.function
        };
      });
      
      console.log('✅ Loaded', convertedTransactions.length, 'real transactions');
      setTransactions(convertedTransactions);
    } catch (error: any) {
      setError(error.message || 'Failed to load transactions');
      console.error('Transaction fetch error:', error);
      // Mock transaction data - expanded for UI testing
      const mockTransactions: PaymentTransaction[] = [
        {
          from: address,
          to: '0x123456789abcdef123456789abcdef1234567890',
          aptosAmount: '2.5',
          inrAmount: convertAPTToINR('2.5'),
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          txHash: '0xa1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          type: 'sent',
          status: 'confirmed'
        },
        {
          from: '0x987654321fedcba987654321fedcba9876543210',
          to: address,
          aptosAmount: '1.2',
          inrAmount: convertAPTToINR('1.2'),
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          txHash: '0xb2c3d4e5f6789012345678901234567890123456789012345678901234567890a1',
          type: 'sent',
          status: 'confirmed'
        },
        {
          from: address,
          to: '0xfedcba0987654321fedcba0987654321fedcba09',
          aptosAmount: '0.75',
          inrAmount: convertAPTToINR('0.75'),
          timestamp: new Date(Date.now() - 21600000), // 6 hours ago
          txHash: '0xc3d4e5f6789012345678901234567890123456789012345678901234567890a1b2',
          type: 'sent',
          status: 'confirmed'
        },
        {
          from: '0x555666777888999000aaabbbcccdddeeef1234567',
          to: address,
          aptosAmount: '0.1',
          inrAmount: convertAPTToINR('0.25'),
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          txHash: '0xd4e5f6789012345678901234567890123456789012345678901234567890a1b2c3',
          type: 'sent',
          status: 'confirmed'
        },
        {
          from: address,
          to: '0x111222333444555666777888999000aaabbbcccd',
          aptosAmount: '0.1',
          inrAmount: convertAPTToINR('5.0'),
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
          txHash: '0xe5f6789012345678901234567890123456789012345678901234567890a1b2c3d4',
          type: 'sent',
          status: 'confirmed'
        },
        {
          from: address,
          to: '0xaabbccddeeff112233445566778899001122334455',
          aptosAmount: '0.05',
          inrAmount: convertAPTToINR('0.05'),
          timestamp: new Date(Date.now() - 345600000), // 4 days ago
          txHash: '0x6789012345678901234567890123456789012345678901234567890a1b2c3d4e5f',
          type: 'sent',
          status: 'confirmed'
        },
        {
          from: '0x1122334455667788990011223344556677889900ab',
          to: address,
          aptosAmount: '1.5',
          inrAmount: convertAPTToINR('3.33'),
          timestamp: new Date(Date.now() - 432000000), // 5 days ago
          txHash: '0x789012345678901234567890123456789012345678901234567890a1b2c3d4e5f6',
          type: 'received',
          status: 'confirmed'
        },
        {
          from: address,
          to: '0xdeadbeefcafebabe1337h4x0r42069leet1234567890',
          aptosAmount: '0.15',
          inrAmount: convertAPTToINR('0.15'),
          timestamp: new Date(Date.now() - 518400000), // 6 days ago
          txHash: '0x89012345678901234567890123456789012345678901234567890a1b2c3d4e5f67',
          type: 'sent',
          status: 'confirmed'
        },
        {
          from: '0x42424242424242424242424242424242424242424242',
          to: address,
          aptosAmount: '1.0',
          inrAmount: convertAPTToINR('10.0'),
          timestamp: new Date(Date.now() - 604800000), // 1 week ago
          txHash: '0x9012345678901234567890123456789012345678901234567890a1b2c3d4e5f678',
          type: 'received',
          status: 'confirmed'
        },
        {
          from: address,
          to: '0x1234567890abcdef1234567890abcdef12345678',
          aptosAmount: '0.8',
          inrAmount: convertAPTToINR('0.8'),
          timestamp: new Date(Date.now() - 1209600000), // 2 weeks ago
          txHash: '0x012345678901234567890123456789012345678901234567890a1b2c3d4e5f6789',
          type: 'sent',
          status: 'confirmed'
        }
      ];
      
      // Sort transactions by timestamp in ascending order
      const sortedTransactions = mockTransactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setTransactions(sortedTransactions);
    } catch (error) {
      const err = error as Error;
      setError(err.message || 'Failed to load transactions');
      console.error('Transaction fetch error:', err);
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [isConnected, address]);

  // Initial load
  useEffect(() => {
    if (isConnected && address) {
      loadTransactions();
    }
  }, [isConnected, address, loadTransactions]);

  // Refresh on refreshFlag change
  useEffect(() => {
    if (isConnected && address && typeof refreshFlag !== 'undefined') {
      loadTransactions(true); // force refresh on flag change
    }
  }, [isConnected, address, refreshFlag, loadTransactions]);

  // Apply filters
  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      // Filter by transaction status
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, typeFilter, statusFilter]);

  const exportToExcel = () => {
    try {
      const exportData = filteredTransactions.map(tx => ({
        'Hash': tx.txHash,
        'From': tx.from,
        'To': tx.to,
        'Amount (APT)': tx.aptosAmount,
        'Amount (INR)': tx.inrAmount.toFixed(2),
        'Type': tx.type,
        'Date': tx.timestamp.toLocaleDateString(),
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      const filename = `aptex-wallet-transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };
  const getStatusBadge = (status: 'confirmed' | 'pending' | 'failed') => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted/20 text-muted-foreground border-border">
            {status}
          </Badge>
        );
    }
  };

  const getTypeIcon = (type: 'sent' | 'received' | 'other') => {
    switch (type) {
      case 'sent':
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      case 'received':
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case 'other':
        return <Clock className="h-5 w-5 text-blue-500" />; // Contract interaction icon
      default:
        return <div className="h-5 w-5" />; // Placeholder
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Connect your wallet to view your transaction history.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="w-full bg-background border-border">
      <CardHeader className="border-b border-border p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl font-medium text-foreground">Transaction History</CardTitle>
            <CardDescription className="text-muted-foreground">Your on-chain Aptex wallet transactions.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => loadTransactions(true)} 
              variant="outline" 
              size="sm" 
              disabled={refreshing || loading}
              className="border-border bg-background hover:bg-muted/20 text-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={exportToExcel} 
              variant="outline" 
              size="sm" 
              disabled={filteredTransactions.length === 0}
              className="border-border bg-background hover:bg-muted/20 text-foreground"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by address or hash..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full border-border bg-background text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-border bg-background text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert className="mb-4 border-red-500/20 bg-red-500/5">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="text-center p-8">
              <div className="flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading transactions from Aptos devnet...</p>
                <p className="text-xs text-muted-foreground">This may take a few seconds</p>
              </div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(tx.type)}
                      <div>
                        <div className="font-medium text-foreground capitalize">{tx.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(tx.status || 'confirmed')}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Amount:</span>
                      <div className="text-right">
                        <div className="font-medium text-foreground">{parseFloat(tx.ethAmount).toFixed(6)} APT</div>
                        <div className="text-xs text-muted-foreground">₹{convertAPTToINR(tx.ethAmount).toLocaleString()}</div>
                        <div className="font-medium text-foreground">{parseFloat(tx.aptosAmount).toFixed(6)} APT</div>
                        <div className="text-xs text-muted-foreground">₹{convertAPTToINR(tx.aptosAmount).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {tx.type === 'sent' ? 'To:' : 'From:'}
                      </span>
                      <div className="font-mono text-xs text-foreground text-right">
                        {tx.type === 'sent' ? tx.to : tx.from}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Hash:</span>
                      <a 
                        href={`https://explorer.aptoslabs.com/txn/${tx.txHash}?network=devnet`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-mono text-xs">{tx.txHash?.substring(0, 6)}...{tx.txHash?.substring(tx.txHash.length - 4)}</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                    
                    {tx.function && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Function:</span>
                        <span className="text-xs font-medium text-foreground">{tx.function}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center p-8">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No On-Chain Transactions Found</h3>
                <p className="text-muted-foreground max-w-sm">Pull to refresh or make a payment to see your history.</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">Type</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">From / To</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">Amount</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">Hash</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">Loading transactions from Aptos devnet...</p>
                      <p className="text-xs text-muted-foreground">This may take a few seconds</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-4">{getTypeIcon(tx.type)}</td>
                    <td className="p-4">
                      <div className="font-mono text-xs text-foreground">
                        {tx.type === 'sent' ? (
                          <>
                            <span className="text-muted-foreground">To:</span> {tx.to.substring(0, 6)}...{tx.to.substring(tx.to.length - 4)}
                          </>
                        ) : (
                          <>
                            <span className="text-muted-foreground">From:</span> {tx.from.substring(0, 6)}...{tx.from.substring(tx.from.length - 4)}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-foreground">{parseFloat(tx.ethAmount).toFixed(6)} APT</div>
                      <div className="text-xs text-muted-foreground">₹{convertAPTToINR(tx.ethAmount).toLocaleString()}</div>
                      {tx.function && (
                        <div className="text-xs text-blue-400 mt-1">{tx.function}</div>
                      )}
                      <div className="font-medium text-foreground">{parseFloat(tx.aptosAmount).toFixed(2)} APT</div>
                      <div className="text-xs text-muted-foreground">₹{convertAPTToINR(tx.aptosAmount).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-foreground">9/25/2025</div>
                    </td>
                    <td className="p-4">{getStatusBadge(tx.status || 'confirmed')}</td>
                    <td className="p-4">
                      <a 
                        href={`https://explorer.aptoslabs.com/txn/${tx.txHash}?network=devnet`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="font-mono text-xs">{tx.txHash?.substring(0, 6)}...{tx.txHash?.substring(tx.txHash.length - 4)}</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center p-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">No On-Chain Transactions Found</h3>
                      <p className="text-muted-foreground max-w-sm">Pull to refresh or make a payment to see your history.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};