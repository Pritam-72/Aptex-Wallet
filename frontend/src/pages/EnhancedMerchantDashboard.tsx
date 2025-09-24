import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, Store, QrCode, Receipt, BarChart3, Settings, Users, CreditCard, DollarSign, TrendingUp, Download, Bell, Shield, ExternalLink, Menu, Package, Percent, Clock, CheckCircle, Wallet, Send, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { WalletSetup } from '@/components/WalletSetup';
import { WalletConnect } from '@/components/WalletConnect';
import { SendTransaction } from '@/components/SendTransaction';
import * as XLSX from 'xlsx';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Analytics as AnalyticsReal } from '@/components/AnalyticsReal';
import { transactionService } from '@/services/TransactionService';

const EnhancedMerchantDashboard = () => {
  const { isConnected, address, balance, refreshBalance, disconnectWallet, getWalletInfo, hasWalletInDatabase } = useWallet();
  const { user } = useAuth();
  const { rate } = useExchangeRate();
  
  const [showBalance, setShowBalance] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [paymentAmountINR, setPaymentAmountINR] = useState(''); // INR input
  const [paymentAmountETH, setPaymentAmountETH] = useState(''); // Calculated ETH
  const [paymentDescription, setPaymentDescription] = useState('');
  
  // Transaction and customer data states
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    returningCustomerRate: 0,
    averageSpend: 0,
    newCustomersThisMonth: 0,
    recentCustomers: [] as any[]
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    // Check if wallet exists and show appropriate modal
    const checkWalletStatus = async () => {
      if (!isConnected) {
        // Check if user has a wallet in database or localStorage
        const walletInfo = getWalletInfo();
        const hasDbWallet = user ? await hasWalletInDatabase() : false;
        
        if (!walletInfo && !hasDbWallet) {
          setShowWalletSetup(true);
        } else if ((walletInfo || hasDbWallet)) {
          setShowWalletConnect(true);
        }
      }
    };
    
    checkWalletStatus();
  }, [isConnected, getWalletInfo, user]);

  useEffect(() => {
    // When INR amount changes, calculate ETH
    if (paymentAmountINR && !isNaN(parseFloat(paymentAmountINR)) && rate > 0) {
      setPaymentAmountETH((parseFloat(paymentAmountINR) / rate).toFixed(6));
    } else {
      setPaymentAmountETH('0');
    }
  }, [paymentAmountINR, rate]);

  // Process customer data from transactions
  const processCustomerData = (transactions: any[]) => {
    const customers = new Map();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    transactions.forEach(tx => {
      // Only consider received payments as customers (exclude sent payments)
      if (tx.type !== 'received') return;
      
      const counterpartyAddress = tx.from; // For received payments, 'from' is the customer
      if (counterpartyAddress === address) return; // Skip self-transactions
      
      if (customers.has(counterpartyAddress)) {
        const customer = customers.get(counterpartyAddress);
        customer.transactionCount++;
        customer.totalSpent += parseFloat(tx.amount);
        if (tx.timestamp > customer.lastTransaction) {
          customer.lastTransaction = tx.timestamp;
          customer.lastTransactionType = tx.type;
        }
        if (tx.timestamp >= monthStart) {
          customer.hasTransactionThisMonth = true;
        }
      } else {
        customers.set(counterpartyAddress, {
          address: counterpartyAddress,
          transactionCount: 1,
          totalSpent: parseFloat(tx.amount),
          lastTransaction: tx.timestamp,
          lastTransactionType: tx.type,
          hasTransactionThisMonth: tx.timestamp >= monthStart
        });
      }
    });

    const customersArray = Array.from(customers.values());
    const totalCustomers = customersArray.length;
    const returningCustomers = customersArray.filter(c => c.transactionCount > 1).length;
    const newCustomersThisMonth = customersArray.filter(c => c.hasTransactionThisMonth).length;
    const totalSpent = customersArray.reduce((sum, c) => sum + c.totalSpent, 0);
    
    setCustomerStats({
      totalCustomers,
      returningCustomerRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,
      averageSpend: totalCustomers > 0 ? totalSpent / totalCustomers : 0,
      newCustomersThisMonth,
      recentCustomers: customersArray
        .sort((a, b) => b.lastTransaction.getTime() - a.lastTransaction.getTime())
        .slice(0, 5)
    });
  };

  // Fetch transaction and customer data
  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !address) return;
      setLoadingStats(true);
      try {
        // Fetch all transactions for this merchant
        const { transactions } = await transactionService.getTransactions(address, rate, 1, 1000);
        
        // Set recent transactions for display
        setRecentTransactions(transactions.slice(0, 10));
        
        // Process customer data
        processCustomerData(transactions);
      } catch (e) {
        console.warn('Failed to fetch transaction data:', e);
        setRecentTransactions([]);
        setCustomerStats({
          totalCustomers: 0,
          returningCustomerRate: 0,
          averageSpend: 0,
          newCustomersThisMonth: 0,
          recentCustomers: []
        });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchData();
  }, [isConnected, address, rate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleWalletSetupComplete = () => {
    setShowWalletSetup(false);
    setShowWalletConnect(true);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowWalletConnect(true);
  };

  const generatePaymentQR = () => {
    if (!paymentAmountINR) return;
    setShowPaymentQR(true);
  };

  const exportTransactionsToExcel = () => {
    try {
      const exportData = recentTransactions.map(transaction => ({
        'ID': transaction.id,
        'Customer': transaction.customer,
        'Product': transaction.product,
        'ETH_Amount': transaction.amount,
        'INR_Amount': transaction.fiatAmount,
        'Status': transaction.status,
        'Time': transaction.time,
        'Hash': transaction.hash
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Merchant_Transactions');
      XLSX.writeFile(workbook, `merchant_transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const sidebarLinks = [
    {
      label: "Overview",
      href: "#",
      icon: <BarChart3 className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('overview')
    },
    {
      label: "Payments",
      href: "#",
      icon: <CreditCard className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('payments')
    },
    {
      label: "Transactions",
      href: "#",
      icon: <Receipt className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('transactions')
    },
    {
      label: "Analytics",
      href: "#",
      icon: <TrendingUp className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('analytics')
    },
    {
      label: "Customers",
      href: "#",
      icon: <Users className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('customers')
    },
    {
      label: "Settings",
      href: "#",
      icon: <Settings className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('settings')
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10">          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ultra-minimal-scrollbar">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">CrypPal Business</span>
            </div>
            
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            {isConnected ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Business Wallet</div>
                <div className="text-sm font-mono">{address && formatAddress(address)}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Button
                  onClick={() => setShowWalletConnect(true)}
                  className="w-full bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
                  size="lg"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Wallet
                </Button>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-black/20 rounded-md blur-lg -z-10 opacity-75"></div>
              </div>
            )}
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Merchant Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <Button
                    onClick={() => {
                      setPaymentAmountINR('');
                      setPaymentDescription('');
                      setShowPaymentQR(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Create Payment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={refreshBalance}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>          {!isConnected && (
            <div className="mb-6 border border-border bg-secondary/20 rounded-lg p-4 flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-muted/20 flex items-center justify-center flex-shrink-0">
                <Store className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium mb-1">
                  Wallet Connection Required
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect your wallet to access all dashboard features and manage your digital assets.
                </p>
              </div>
              <Button
                onClick={() => setShowWalletConnect(true)}
                variant="outline"
                size="sm"
                className="border-border bg-background hover:bg-muted/20 text-foreground text-xs px-3 py-1.5 h-auto flex-shrink-0"
              >
                Connect
              </Button>
            </div>
          )}

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {showBalance ? `${dailyStats.totalSales} ETH` : '••••••'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {showBalance ? `≈ ₹${(parseFloat(dailyStats.totalSales) * 251100).toFixed(2)}` : '••••••'}
                    </div>
                    <div className="text-xs text-green-600 mt-1">+12.5% from yesterday</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                    <Receipt className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dailyStats.totalTransactions}</div>
                    <div className="text-sm text-gray-600">Today</div>
                    <div className="text-xs text-green-600 mt-1">+8% from yesterday</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {showBalance ? `${dailyStats.averageOrder} ETH` : '••••••'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {showBalance ? `≈ ₹${(parseFloat(dailyStats.averageOrder) * 251100).toFixed(2)}` : '••••••'}
                    </div>
                    <div className="text-xs text-green-600 mt-1">+3.2% from yesterday</div>
                    <div className="text-xs text-muted-foreground">Based on received transactions</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                    <Users className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dailyStats.newCustomers}</div>
                    <div className="text-sm text-gray-600">Today</div>
                    <div className="text-xs text-green-600 mt-1">+25% from yesterday</div>
                  </CardContent>
                </Card>
              </div>

              {/* Wallet Balance */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Business Wallet
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBalance(!showBalance)}
                    >
                      {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold">
                        {showBalance ? (balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH') : '••••••'}
                      </div>
                      <div className="text-gray-600">
                        {showBalance ? (balance ? `≈ ₹${(parseFloat(balance) * 251100).toFixed(2)}` : '≈ ₹0.00') : '••••••'}
                      </div>
                    </div>
                    
                    {address && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Wallet Address</div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <code className="text-sm font-mono flex-1">{formatAddress(address)}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(address)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowSendTransaction(true)}
                        variant="outline" 
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Transfer Funds
                      </Button>
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setPaymentAmountINR('');
                          setPaymentDescription('');
                          setShowPaymentQR(false);
                        }}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate Payment QR
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Transactions</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveSection('transactions')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-100">
                            <Plus className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{tx.customer}</div>
                            <div className="text-sm text-gray-600">{tx.product}</div>
                            <div className="text-xs text-gray-500">{tx.time}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">+{tx.amount} ETH</div>
                          <div className="text-sm text-gray-600">{tx.fiatAmount}</div>
                          <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payments Section */}
          {activeSection === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Payment Management</h2>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowPaymentQR(false)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Create New Payment
                </Button>
              </div>

              {/* Payment Creation */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Payment QR Code</CardTitle>
                  <CardDescription>
                    Create a QR code for customers to scan and pay instantly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentAmountINR">Amount (INR)</Label>
                      <Input
                        id="paymentAmountINR"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={paymentAmountINR}
                        onChange={e => {
                          const val = e.target.value.replace(/[^\d.]/g, '');
                          setPaymentAmountINR(val.startsWith('-') ? '' : val);
                        }}
                        placeholder="Enter amount in INR"
                        className="mt-2 h-11 bg-background border-border"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        type="text"
                        placeholder="Coffee & Pastry"
                        value={paymentDescription}
                        onChange={(e) => setPaymentDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* ETH Calculated Display */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <span>ETH to be received:</span>
                    <span className="font-mono font-semibold">{paymentAmountETH} ETH</span>
                  </div>
                  
                  <Button 
                    onClick={generatePaymentQR}
                    disabled={!paymentAmountINR || parseFloat(paymentAmountINR) <= 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Generate QR Code
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Payment Amounts */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Payment Amounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['100', '250', '500', '1000'].map((inr) => (
                      <Button
                        key={inr}
                        variant="outline"
                        onClick={() => setPaymentAmountINR(inr)}
                        className="h-16 flex flex-col"
                      >
                        <span className="text-lg font-bold">₹{inr}</span>
                        <span className="text-xs text-gray-600">
                          ≈ {(parseFloat(inr) / rate).toFixed(4)} ETH
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions Section */}
          {activeSection === 'transactions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Transaction History</h2>
                <Button onClick={exportTransactionsToExcel} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {recentTransactions.map((tx, index) => (
                      <div key={tx.id} className={`p-4 ${index !== recentTransactions.length - 1 ? 'border-b' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-green-100">
                              <Receipt className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">{tx.customer}</div>
                              <div className="text-sm text-gray-600">{tx.product}</div>
                              <div className="text-xs text-gray-500">{tx.time}</div>
                              <div className="text-xs font-mono text-gray-500">{tx.hash}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-medium text-green-600">
                              +{tx.amount} ETH
                            </div>
                            <div className="text-sm text-gray-600">{tx.fiatAmount}</div>
                            <Badge 
                              variant={tx.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Business Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>This Week</span>
                        <span className="font-medium">8.45 ETH</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Last Week</span>
                        <span className="font-medium">7.12 ETH</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Growth</span>
                        <span className="font-medium text-green-600">+18.7%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Coffee & Pastry</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Lunch Combo</span>
                        <span className="font-medium">32%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Books Bundle</span>
                        <span className="font-medium">23%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Customers Section */}
          {activeSection === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Customer Management</h2>
                <Button onClick={() => {
                  const exportData = customerStats.recentCustomers.map(customer => ({
                    'Address': customer.address,
                    'Transaction Count': customer.transactionCount,
                    'Total Spent (ETH)': customer.totalSpent,
                    'Last Transaction': customer.lastTransaction.toLocaleDateString(),
                    'Is Returning Customer': customer.transactionCount > 1 ? 'Yes' : 'No'
                  }));

                  const workbook = XLSX.utils.book_new();
                  const worksheet = XLSX.utils.json_to_sheet(exportData);
                  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
                  XLSX.writeFile(workbook, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
                }} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Customers
                </Button>
              </div>

              {/* Customer Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Customers</p>
                        <p className="text-2xl font-bold">{customerStats.totalCustomers}</p>
                        <p className="text-xs text-green-600">+{customerStats.newCustomersThisMonth} this month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Returning Customers</p>
                        <p className="text-2xl font-bold">{customerStats.returningCustomerRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Loyalty rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Average Spend</p>
                        <p className="text-2xl font-bold">{customerStats.averageSpend.toFixed(4)} ETH</p>
                        <p className="text-xs text-muted-foreground">
                          ≈ ₹{(customerStats.averageSpend * rate).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">New This Month</p>
                        <p className="text-2xl font-bold">{customerStats.newCustomersThisMonth}</p>
                        <p className="text-xs text-muted-foreground">Recent acquisitions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Customers List */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Customers</CardTitle>
                  <CardDescription>
                    Customers who have made payments to your business (received payments only)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading customer data...</p>
                    </div>
                  ) : customerStats.recentCustomers.length > 0 ? (
                    <div className="space-y-4">
                      {customerStats.recentCustomers.map((customer, index) => (
                        <div key={customer.address} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-100">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium font-mono">{formatAddress(customer.address)}</div>
                              <div className="text-sm text-muted-foreground">
                                {customer.transactionCount} transaction{customer.transactionCount > 1 ? 's' : ''}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Last: {customer.lastTransaction.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{customer.totalSpent.toFixed(4)} ETH</div>
                            <div className="text-sm text-muted-foreground">
                              ≈ ₹{(customer.totalSpent * rate).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                            </div>
                            {customer.transactionCount > 1 && (
                              <Badge variant="secondary" className="mt-1">
                                Returning
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No customers yet</p>
                      <p className="text-sm text-muted-foreground">Customers will appear here when they make payments to your business</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Payment QR Modal */}
      <Dialog open={showPaymentQR} onOpenChange={setShowPaymentQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
            <DialogDescription>
              Customer can scan this QR code to send payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 text-center">
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="w-48 h-48 bg-white mx-auto rounded border-2 border-dashed flex items-center justify-center">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-lg font-bold">{paymentAmountETH} ETH</div>
              {paymentDescription && (
                <div className="text-sm text-gray-600">{paymentDescription}</div>
              )}
              <div className="text-sm text-gray-600">
                ≈ ₹{(parseFloat(paymentAmountETH) * 251100).toFixed(2)}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 font-mono">
              Send to: {address && formatAddress(address)}
            </div>
            
            <Button onClick={() => setShowPaymentQR(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <WalletSetup
        isOpen={showWalletSetup}
        onClose={() => setShowWalletSetup(false)}
        onComplete={handleWalletSetupComplete}
      />
      
      <WalletConnect
        isOpen={showWalletConnect}
        onClose={() => setShowWalletConnect(false)}
        onSetupNew={() => {
          setShowWalletConnect(false);
          setShowWalletSetup(true);
        }}
      />
      
      <SendTransaction
        isOpen={showSendTransaction}
        onClose={() => setShowSendTransaction(false)}
      />
    </div>
  );
};

export default EnhancedMerchantDashboard;
