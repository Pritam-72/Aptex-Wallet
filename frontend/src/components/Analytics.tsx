import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ArrowUpDown, Calendar, Download } from 'lucide-react';

interface AnalyticsData {
  totalTransactions: number;
  totalVolume: number;
  totalVolumeINR: number;
  averageTransaction: number;
  monthlyGrowth: number;
  frequentMerchants: Array<{ name: string; transactions: number; volume: string }>;
  spendingByCategory: Array<{ category: string; amount: number; percentage: number }>;
  monthlyData: Array<{ month: string; sent: number; received: number; volume: number }>;
}

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);

  const StatCard = ({ title, value, change, icon: Icon, suffix = '' }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<{ className?: string }>;
    suffix?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}{suffix}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(change)}% vs last month
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

  // Mock data for demonstration
  const mockAnalytics: AnalyticsData = {
    totalTransactions: 42,
    totalVolume: 2.45,
    totalVolumeINR: 615000,
    averageTransaction: 0.058,
    monthlyGrowth: 12.5,
    frequentMerchants: [
      { name: "Coffee Shop", transactions: 15, volume: "0.45" },
      { name: "Online Store", transactions: 8, volume: "0.78" }
    ],
    spendingByCategory: [
      { category: "Food & Dining", amount: 45000, percentage: 35 },
      { category: "Shopping", amount: 32000, percentage: 25 }
    ],
    monthlyData: [
      { month: "Jan", sent: 0.5, received: 0.3, volume: 0.8 },
      { month: "Feb", sent: 0.7, received: 0.4, volume: 1.1 }
    ]
  };

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
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Transactions"
          value={mockAnalytics.totalTransactions}
          change={mockAnalytics.monthlyGrowth}
          icon={ArrowUpDown}
        />
        <StatCard
          title="Total Volume"
          value={mockAnalytics.totalVolume}
          change={8.2}
          icon={DollarSign}
          suffix=" USD"
        />
        <StatCard
          title="Volume (INR)"
          value={`₹${mockAnalytics.totalVolumeINR.toLocaleString()}`}
          change={mockAnalytics.monthlyGrowth}
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Transaction"
          value={mockAnalytics.averageTransaction}
          change={-2.4}
          icon={BarChart3}
          suffix=" USD"
        />
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Transaction Trends</CardTitle>
            <CardDescription>
              Overview of your sending and receiving patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.monthlyData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{data.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-green-600">+{data.received}</span>
                    <span className="text-sm text-red-600">-{data.sent}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spending Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>
              Breakdown of your transaction categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[]}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Frequent Merchants */}
      <Card>
        <CardHeader>
          <CardTitle>Frequent Merchants</CardTitle>
          <CardDescription>
            Your most frequent transaction partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[]}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>
            AI-powered insights based on your transaction patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[]}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
