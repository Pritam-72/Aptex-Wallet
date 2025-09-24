import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ArrowUpDown, Calendar, Download, RefreshCw, Wallet, Send, ArrowDownLeft } from 'lucide-react';
// Removed blockchain dependencies
import * as XLSX from 'xlsx';

interface AnalyticsData {
  totalTransactions: number;
  totalVolume: number;
  totalVolumeINR: number;
  totalSent: number;
  totalReceived: number;
  averageTransaction: number;
  monthlyGrowth: number;
  weeklyActivity: Array<{ day: string; transactions: number; volume: number }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number; count: number }>;
  monthlyTrends: Array<{ month: string; sent: number; received: number; volume: number }>;
  gasAnalytics: { totalGasUsed: number; totalGasCost: number; averageGasPrice: number };
  frequentAddresses: Array<{ address: string; transactions: number; volume: string; type: 'sent' | 'received' }>;
}

export const Analytics: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { convertAPTToINR, rate } = useExchangeRate();
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load and analyze transaction data
  const loadAnalytics = useCallback(async (refresh = false) => {
    if (!isConnected || !address) return;

    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);

    try {
      // Fetch transactions
      const result = await transactionService.getTransactions(address, rate);
      setTransactions(result.transactions);

      // Filter by time range
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const filteredTxs = result.transactions.filter(tx => tx.timestamp >= startDate);

      // Calculate analytics
      const analyticsData = calculateAnalytics(filteredTxs, address);
      setAnalytics(analyticsData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isConnected, address, timeRange, rate]);

  // Calculate comprehensive analytics
  const calculateAnalytics = (txs: Transaction[], userAddress: string): AnalyticsData => {
    const sent = txs.filter(tx => tx.from.toLowerCase() === userAddress.toLowerCase());
    const received = txs.filter(tx => tx.to.toLowerCase() === userAddress.toLowerCase());
    
    const totalSent = sent.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalReceived = received.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalVolume = totalSent + totalReceived;

    // Weekly activity
    const weeklyActivity = calculateWeeklyActivity(txs);
    
    // Category breakdown based on transaction patterns
    const categoryBreakdown = calculateCategoryBreakdown(txs);
    
    // Monthly trends
    const monthlyTrends = calculateMonthlyTrends(txs);
    
    // Gas analytics
    const gasAnalytics = calculateGasAnalytics(txs);
    
    // Frequent addresses
    const frequentAddresses = calculateFrequentAddresses(txs, userAddress);

    // Calculate growth (simplified)
    const lastMonth = txs.filter(tx => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      return tx.timestamp >= thirtyDaysAgo;
    });
    const previousMonth = txs.filter(tx => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      return tx.timestamp >= sixtyDaysAgo && tx.timestamp < thirtyDaysAgo;
    });
    
    const currentVolume = lastMonth.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const previousVolume = previousMonth.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const monthlyGrowth = previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0;

    return {
      totalTransactions: txs.length,
      totalVolume,
      totalVolumeINR: totalVolume * rate,
      totalSent,
      totalReceived,
      averageTransaction: received.length > 0 ? totalReceived / received.length : 0,
      monthlyGrowth,
      weeklyActivity,
      categoryBreakdown,
      monthlyTrends,
      gasAnalytics,
      frequentAddresses
    };
  };

  const calculateWeeklyActivity = (txs: Transaction[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activity = days.map(day => ({ day, transactions: 0, volume: 0 }));
    
    txs.forEach(tx => {
      const dayIndex = (tx.timestamp.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      activity[dayIndex].transactions++;
      activity[dayIndex].volume += parseFloat(tx.amount);
    });
    
    return activity;
  };

  const calculateCategoryBreakdown = (txs: Transaction[]) => {
    const categories: { [key: string]: { amount: number; count: number } } = {};
    
    txs.forEach(tx => {
      let category = 'Other';
      const amount = parseFloat(tx.amount);
      
      // Categorize based on amount and description
      if (tx.description?.toLowerCase().includes('coffee') || 
          tx.description?.toLowerCase().includes('food') ||
          tx.description?.toLowerCase().includes('restaurant')) {
        category = 'Food & Dining';
      } else if (amount > 0.1) {
        category = 'Large Transfers';
      } else if (amount > 0.01) {
        category = 'Medium Transfers';
      } else {
        category = 'Micro Payments';
      }
      
      if (!categories[category]) {
        categories[category] = { amount: 0, count: 0 };
      }
      categories[category].amount += amount;
      categories[category].count++;
    });
    
    const total = Object.values(categories).reduce((sum, cat) => sum + cat.amount, 0);
    
    return Object.entries(categories).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: total > 0 ? (data.amount / total) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  };

  const calculateMonthlyTrends = (txs: Transaction[]) => {
    const months: { [key: string]: { sent: number; received: number; volume: number } } = {};
    
    txs.forEach(tx => {
      const monthKey = tx.timestamp.toISOString().substr(0, 7); // YYYY-MM
      if (!months[monthKey]) {
        months[monthKey] = { sent: 0, received: 0, volume: 0 };
      }
      
      const amount = parseFloat(tx.amount);
      months[monthKey].volume += amount;
      
      if (tx.type === 'sent') {
        months[monthKey].sent += amount;
      } else if (tx.type === 'received') {
        months[monthKey].received += amount;
      }
    });
    
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        ...data
      }));
  };

  const calculateGasAnalytics = (txs: Transaction[]) => {
    let totalGasUsed = 0;
    let totalGasCost = 0;
    let totalGasPrice = 0;
    let count = 0;
    
    txs.forEach(tx => {
      if (tx.gasUsed && tx.gasPrice) {
        const gasUsed = parseInt(tx.gasUsed);
        const gasPrice = parseFloat(tx.gasPrice);
        totalGasUsed += gasUsed;
        totalGasCost += (gasUsed * gasPrice) / 1e9; // Convert to APT
        totalGasPrice += gasPrice;
        count++;
      }
    });
    
    return {
      totalGasUsed,
      totalGasCost,
      averageGasPrice: count > 0 ? totalGasPrice / count : 0
    };
  };

  const calculateFrequentAddresses = (txs: Transaction[], userAddress: string) => {
    const addresses: { [key: string]: { transactions: number; volume: number; type: 'sent' | 'received' } } = {};
    
    txs.forEach(tx => {
      const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();
      const otherAddress = isOutgoing ? tx.to : tx.from;
      const type = isOutgoing ? 'sent' : 'received';
      
      if (!addresses[otherAddress]) {
        addresses[otherAddress] = { transactions: 0, volume: 0, type };
      }
      addresses[otherAddress].transactions++;
      addresses[otherAddress].volume += parseFloat(tx.amount);
    });
    
    return Object.entries(addresses)
      .sort(([,a], [,b]) => b.transactions - a.transactions)
      .slice(0, 5)
      .map(([address, data]) => ({
        address: `${address.slice(0, 6)}...${address.slice(-4)}`,
        transactions: data.transactions,
        volume: data.volume.toFixed(4),
        type: data.type
      }));
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Transactions', analytics.totalTransactions],
        ['Total Volume (APT)', analytics.totalVolume.toFixed(6)],
        ['Total Volume (INR)', analytics.totalVolumeINR.toFixed(2)],
        ['Total Sent (APT)', analytics.totalSent.toFixed(6)],
        ['Total Received (APT)', analytics.totalReceived.toFixed(6)],
        ['Average Transaction (APT)', analytics.averageTransaction.toFixed(6)],
        ['Monthly Growth (%)', analytics.monthlyGrowth.toFixed(2)]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Category breakdown sheet
      const categorySheet = XLSX.utils.json_to_sheet(analytics.categoryBreakdown);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categories');

      // Weekly activity sheet
      const weeklySheet = XLSX.utils.json_to_sheet(analytics.weeklyActivity);
      XLSX.utils.book_append_sheet(workbook, weeklySheet, 'Weekly Activity');

      const filename = `cryppal-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadAnalytics();
    }
  }, [isConnected, address, timeRange, rate, loadAnalytics]);

  const StatCard = ({ title, value, change, icon: Icon, suffix = '', prefix = '' }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<{ className?: string }>;
    suffix?: string;
    prefix?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{prefix}{value}{suffix}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}% vs last period
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Connect your wallet to view detailed analytics and insights about your transactions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Insights and trends for your crypto transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAnalytics}
            disabled={!analytics}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      ) : analytics ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Transactions"
              value={analytics.totalTransactions}
              icon={ArrowUpDown}
            />
            <StatCard
              title="Total Volume"
              value={analytics.totalVolume.toFixed(4)}
              suffix=" APT"
              icon={Wallet}
              change={analytics.monthlyGrowth}
            />
            <StatCard
              title="Total Volume (INR)"
              value={analytics.totalVolumeINR.toLocaleString()}
              prefix="₹"
              icon={DollarSign}
            />
            <StatCard
              title="Average Transaction"
              value={analytics.averageTransaction.toFixed(6)}
              suffix=" APT"
              icon={BarChart3}
            />
          </div>

          {/* Sent vs Received */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Total Sent"
              value={analytics.totalSent.toFixed(4)}
              suffix=" APT"
              icon={Send}
            />
            <StatCard
              title="Total Received"
              value={analytics.totalReceived.toFixed(4)}
              suffix=" APT"
              icon={ArrowDownLeft}
            />
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Spending Categories</CardTitle>
              <CardDescription>Breakdown of your transaction patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.categoryBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-primary/20" />
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.count} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{category.amount.toFixed(4)} APT</p>
                      <p className="text-sm text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Frequent Addresses */}
          <Card>
            <CardHeader>
              <CardTitle>Frequent Addresses</CardTitle>
              <CardDescription>Your most common transaction partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.frequentAddresses.map((addr, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={addr.type === 'sent' ? 'destructive' : 'default'}>
                        {addr.type}
                      </Badge>
                      <span className="font-mono text-sm">{addr.address}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{addr.volume} APT</p>
                      <p className="text-sm text-muted-foreground">
                        {addr.transactions} transactions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gas Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Gas Analytics</CardTitle>
              <CardDescription>Your transaction fee insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics.gasAnalytics.totalGasUsed.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Gas Used</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics.gasAnalytics.totalGasCost.toFixed(6)}</p>
                  <p className="text-sm text-muted-foreground">Total Gas Cost (APT)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics.gasAnalytics.averageGasPrice.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Average Gas Price (Gwei)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No transaction data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
