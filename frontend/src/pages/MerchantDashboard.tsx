import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, Store, QrCode, Receipt, BarChart3, Settings, Users, CreditCard, DollarSign, TrendingUp, Download, Bell, Shield, ExternalLink, Menu, Package, Percent, Clock, CheckCircle, Wallet, Lock, RefreshCw, Plus, Minus, User, LogOut, ChevronDown, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { WalletSetup } from '@/components/WalletSetup';
import { WalletConnect } from '@/components/WalletConnect';
import { SendTransaction } from '@/components/SendTransaction';
import { ethToInrSync, formatAddress, formatEth, copyToClipboard, generatePaymentQRData } from '@/lib/utils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { ExchangeRateDisplay } from '@/components/ExchangeRateDisplay';
import * as XLSX from 'xlsx';
import { TransactionHistory } from '@/components/TransactionHistoryReal';
import transactionService from '@/services/TransactionService';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, PieChart, Pie } from 'recharts';
import { QRCodeCanvas } from 'qrcode.react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MerchantSettings } from '@/components/MerchantSettings';

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isConnected, address, balance, refreshBalance, disconnectWallet, getWalletInfo, hasWalletInDatabase } = useWallet();
  const { convertETHToINR, rate, isLive, lastUpdated, refresh: refreshRate } = useExchangeRate();
  
  const [showBalance, setShowBalance] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [paymentAmountINR, setPaymentAmountINR] = useState(''); // INR input
  const [paymentAmountETH, setPaymentAmountETH] = useState(''); // Calculated ETH
  const { rate: ethToInr } = useExchangeRate();
  const [overviewStats, setOverviewStats] = useState({
    totalTransactions: 0,
    totalSent: 0,
    totalReceived: 0,
    netBalance: 0,
    last30Days: 0,
    averageAmount: 0,
    pending: 0,
    confirmed: 0,
    failed: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [recentTxs, setRecentTxs] = useState([]);
  const [loadingRecentTxs, setLoadingRecentTxs] = useState(false);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [balanceChange24h, setBalanceChange24h] = useState(0);
  const [showReceiveQR, setShowReceiveQR] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'privacy'>('profile');

  // Add customer stats state
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    returningCustomerRate: 0,
    averageSpend: 0,
    newCustomersThisMonth: 0,
    recentCustomers: [] as {
      address: string;
      lastTransaction: Date;
      totalSpent: number;
      transactionCount: number;
      lastTransactionType: string;
    }[]
  });

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'M';
    const fullName = user.user_metadata?.full_name || user.email;
    if (fullName && fullName !== user.email) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email.charAt(0).toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'Merchant';
    return user.user_metadata?.full_name || user.email.split('@')[0];
  };

  // Get user account type
  const getUserAccountType = () => {
    if (!user) return 'merchant';
    return user.user_metadata?.account_type || 'merchant';
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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

  // When INR amount changes, calculate ETH
  useEffect(() => {
    if (paymentAmountINR && !isNaN(parseFloat(paymentAmountINR)) && rate > 0) {
      setPaymentAmountETH((parseFloat(paymentAmountINR) / rate).toFixed(6));
    } else {
      setPaymentAmountETH('0');
    }
  }, [paymentAmountINR, rate]);

  // Add function to process customer data
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

  // Update fetchStats to include customer processing
  useEffect(() => {
    const fetchStats = async () => {
      if (!isConnected || !address) return;
      setLoadingStats(true);
      try {
        // Fetch all transactions for this merchant
        const { transactions } = await transactionService.getTransactions(address, rate, 1, 1000);
        const stats = transactionService.getTransactionStats(transactions, address);
        setOverviewStats(stats);
        
        // Process customer data
        processCustomerData(transactions);
      } catch (e) {
        console.warn('Failed to fetch transaction stats:', e);
        setOverviewStats({
          totalTransactions: 0,
          totalSent: 0,
          totalReceived: 0,
          netBalance: 0,
          last30Days: 0,
          averageAmount: 0,
          pending: 0,
          confirmed: 0,
          failed: 0,
        });
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
    fetchStats();
  }, [isConnected, address, rate]);

  useEffect(() => {
    const fetchRecentTxs = async () => {
      if (!isConnected || !address) return;
      setLoadingRecentTxs(true);
      try {
        const { transactions } = await transactionService.getTransactions(address, rate, 1, 3);
        setRecentTxs(transactions);
      } catch (e) {
        console.warn('Failed to fetch recent transactions:', e);
        setRecentTxs([]);
      } finally {
        setLoadingRecentTxs(false);
      }
    };
    fetchRecentTxs();
  }, [isConnected, address, rate]);

  // Store daily balance snapshot in localStorage
  useEffect(() => {
    if (!balance || !isConnected || !address) return;
    const today = new Date().toISOString().split('T')[0];
    const key = `crypPal_balance_snapshots_${address}`;
    const snapshots = JSON.parse(localStorage.getItem(key) || '{}');
    // Always update today's snapshot with the latest balance
    snapshots[today] = {
      date: today,
      eth: parseFloat(balance),
      inr: parseFloat(balance) * rate
    };
    localStorage.setItem(key, JSON.stringify(snapshots));
  }, [balance, rate, isConnected, address]);

  // Build balance history from daily snapshots (last 7 days)
  useEffect(() => {
    if (!isConnected || !address) return;
    const key = `crypPal_balance_snapshots_${address}`;
    const snapshots = JSON.parse(localStorage.getItem(key) || '{}');
    const days = 7;
    const history = [];
    let lastBalance = 0;
    let lastInr = 0;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (snapshots[dateStr]) {
        lastBalance = snapshots[dateStr].eth;
        lastInr = snapshots[dateStr].inr;
        history.push({
          date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          eth: lastBalance,
          inr: lastInr
        });
      } else {
        // Repeat last known balance
        history.push({
          date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          eth: lastBalance,
          inr: lastInr
        });
      }
    }
    setBalanceHistory(history);
  }, [balance, rate, isConnected, address]);

  // Calculate real 24h change in INR value
  useEffect(() => {
    if (!isConnected || !address) {
      setBalanceChange24h(0);
      return;
    }
    const key = `crypPal_balance_snapshots_${address}`;
    const snapshots = JSON.parse(localStorage.getItem(key) || '{}');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayInr = snapshots[todayStr]?.inr;
    const yesterdayInr = snapshots[yesterdayStr]?.inr;
    if (todayInr !== undefined && yesterdayInr !== undefined && yesterdayInr !== 0) {
      setBalanceChange24h(((todayInr - yesterdayInr) / yesterdayInr) * 100);
    } else {
      setBalanceChange24h(0);
    }
  }, [balance, rate, isConnected, address]);

  const handleWalletSetupComplete = () => {
    setShowWalletSetup(false);
    setShowWalletConnect(true);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowWalletConnect(true);
  };

  const generatePaymentQR = () => {
    if (!paymentAmountINR || !address) return;
    setShowPaymentQR(true);
  };

  const exportTransactionsToExcel = () => {
    try {
      console.log('Starting export...', recentTxs);
      
      // Prepare data for export with real transaction data
      const exportData = recentTxs.map(transaction => ({
        'Transaction Hash': transaction.hash,
        'From': transaction.from,
        'To': transaction.to,
        'ETH Amount': transaction.amount,
        'INR Amount': (parseFloat(transaction.amount) * rate).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        'Status': transaction.status,
        'Timestamp': transaction.timestamp.toLocaleString(),
        'Type': transaction.type,
        'Block Number': transaction.blockNumber || 'Pending',
        'Gas Used': transaction.gasUsed || 'N/A'
      }));

      console.log('Export data prepared:', exportData);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      worksheet['!cols'] = [
        { width: 20 }, // Transaction Hash
        { width: 15 }, // From
        { width: 15 }, // To
        { width: 12 }, // ETH Amount
        { width: 15 }, // INR Amount
        { width: 10 }, // Status
        { width: 20 }, // Timestamp
        { width: 10 }, // Type
        { width: 12 }, // Block Number
        { width: 10 }  // Gas Used
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `crypPal_transactions_${currentDate}.xlsx`;

      console.log('Attempting to save file:', filename);

      // Save file
      XLSX.writeFile(workbook, filename);
      
      console.log('Export completed successfully');
      
      // Show success message
      alert('Transactions exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  const exportBusinessDataToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Transactions sheet
    const transactionsData = recentTxs.map(transaction => ({
      'ID': transaction.hash,
      'From': transaction.from,
      'To': transaction.to,
      'ETH Amount': transaction.amount,
      'INR Amount': (parseFloat(transaction.amount) * rate).toLocaleString('en-IN', {maximumFractionDigits: 2}),
      'Status': transaction.status,
      'Time': transaction.timestamp.toLocaleString()
    }));
    const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

    // Business metrics sheet
    const successRate = overviewStats.totalTransactions > 0 ? 
      Math.round((overviewStats.confirmed / overviewStats.totalTransactions) * 100) : 100;
    
    const metricsData = [
      { 'Metric': 'Total Revenue', 'Value': `₹${(overviewStats.totalReceived * rate).toLocaleString('en-IN', {maximumFractionDigits: 2})}`, 'Change': 'Based on confirmed transactions' },
      { 'Metric': 'Total Transactions', 'Value': overviewStats.totalTransactions.toString(), 'Change': `${overviewStats.pending} pending` },
      { 'Metric': 'Average Order Value', 'Value': `₹${(overviewStats.averageAmount * rate).toLocaleString('en-IN', {maximumFractionDigits: 2})}`, 'Change': 'Based on received transactions' },
      { 'Metric': 'Success Rate', 'Value': `${successRate}%`, 'Change': `${overviewStats.confirmed} confirmed / ${overviewStats.totalTransactions} total` },
      { 'Metric': 'Last 30 Days Activity', 'Value': overviewStats.last30Days.toString(), 'Change': 'Transactions in last 30 days' },
      { 'Metric': 'Net Balance', 'Value': `₹${(overviewStats.netBalance * rate).toLocaleString('en-IN', {maximumFractionDigits: 2})}`, 'Change': 'Received minus sent' },
      { 'Metric': 'Failed Transactions', 'Value': overviewStats.failed.toString(), 'Change': 'Number of failed transactions' }
    ];
    const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Business Metrics');

    // Payment methods sheet
    const paymentMethodsData = [
      { 'Payment Method': 'Ethereum (ETH)', 'Percentage': '100%', 'Usage': 'Primary' }
    ];
    const paymentMethodsSheet = XLSX.utils.json_to_sheet(paymentMethodsData);
    XLSX.utils.book_append_sheet(workbook, paymentMethodsSheet, 'Payment Methods');

    // Generate filename
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `crypPal_business_report_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  };

  const exportCustomersToExcel = () => {
    // Prepare transaction counterparties data (addresses that have interacted with this wallet)
    const uniqueCounterparties = new Map();
    
    // Process transactions to identify unique counterparties
    recentTxs.forEach(tx => {
      const counterpartyAddress = tx.type === 'received' ? tx.from : tx.to;
      const txType = tx.type === 'received' ? 'Incoming' : 'Outgoing';
      
      if (counterpartyAddress !== address) {
        // If we've seen this address before, update its data
        if (uniqueCounterparties.has(counterpartyAddress)) {
          const existing = uniqueCounterparties.get(counterpartyAddress);
          uniqueCounterparties.set(counterpartyAddress, {
            address: counterpartyAddress,
            transactionCount: existing.transactionCount + 1,
            lastTransaction: tx.timestamp > existing.lastTransaction ? tx.timestamp : existing.lastTransaction,
            totalValue: existing.totalValue + parseFloat(tx.amount),
            transactionTypes: existing.transactionTypes.includes(txType) ? 
              existing.transactionTypes : [...existing.transactionTypes, txType]
          });
        } else {
          // First time seeing this address
          uniqueCounterparties.set(counterpartyAddress, {
            address: counterpartyAddress,
            transactionCount: 1,
            lastTransaction: tx.timestamp,
            totalValue: parseFloat(tx.amount),
            transactionTypes: [txType]
          });
        }
      }
    });
    
    // Convert to array for export
    const counterpartyData = Array.from(uniqueCounterparties.values()).map((cp, index) => ({
      'ID': index + 1,
      'Wallet Address': cp.address,
      'Transaction Count': cp.transactionCount,
      'Last Transaction': cp.lastTransaction.toLocaleString(),
      'Total ETH': cp.totalValue.toFixed(6),
      'Total INR': (cp.totalValue * rate).toLocaleString('en-IN', {maximumFractionDigits: 2}),
      'Transaction Types': cp.transactionTypes.join(', ')
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(counterpartyData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 5 },  // ID
      { width: 45 }, // Wallet Address
      { width: 15 }, // Transaction Count
      { width: 20 }, // Last Transaction
      { width: 10 }, // Total ETH
      { width: 15 }, // Total INR
      { width: 20 }  // Transaction Types
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Counterparties');

    // Generate filename
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `crypPal_counterparties_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  };

  const sidebarLinks = [
    {
      label: 'Overview',
      href: '#',
      icon: <BarChart3 className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'overview'
    },
    {
      label: 'Payments',
      href: '#',
      icon: <Receipt className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'payments'
    },
    {
      label: 'QR Codes',
      href: '#',
      icon: <QrCode className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'qrcodes',
      action: () => {
        setActiveSection('qrcodes');
        setShowReceiveQR(false); // Ensure QR popup is closed when switching to QR section
      }
    },
    {
      label: 'Customers',
      href: '#',
      icon: <Users className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'customers'
    },
    {
      label: 'Settings',
      href: '#',
      icon: <Settings className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'settings'
    },
  ];

  const quickActionLinks = [
    {
      label: 'Generate QR',
      href: '#',
      icon: <QrCode className="text-foreground h-5 w-5 flex-shrink-0" />,
      action: () => setActiveSection('qrcodes')
    },
    {
      label: 'View Payments',
      href: '#',
      icon: <Receipt className="text-foreground h-5 w-5 flex-shrink-0" />,
      action: () => setActiveSection('payments')
    },    
    {
      label: 'Export Data',
      href: '#',
      icon: <Download className="text-foreground h-5 w-5 flex-shrink-0" />,
      action: () => exportBusinessDataToExcel()
    },
    {
      label: 'Explorer',
      href: '#',
      icon: <ExternalLink className="text-foreground h-5 w-5 flex-shrink-0" />,
      action: () => window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')
    },
  ];

  const renderMainContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-4">
            {/* Wallet Connection Alert */}
            {!isConnected && (
              <div className="mb-4 border border-border bg-secondary/20 rounded-lg p-4 flex flex-col md:flex-row items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-muted/20 flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium mb-1">
                    Wallet Connection Required
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Connect your wallet to access all dashboard features.
                  </p>
                </div>
                <div className="relative">
                  <Button
                    onClick={() => setShowWalletConnect(true)}
                    className="w-full md:w-auto bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0 text-sm px-4 py-2"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-black/20 rounded-md blur-lg -z-10 opacity-75"></div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 w-full">
              <Card className="p-4 md:p-6 bg-background border-border rounded-xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Total Revenue</p>
                    <p className="text-lg md:text-2xl font-bold text-foreground mt-2">
                      {showBalance ? `₹${(overviewStats.totalReceived * rate).toLocaleString('en-IN', {maximumFractionDigits: 2})}` : '••••••'}
                    </p>
                    <p className="text-xs text-success mt-1">
                      {overviewStats.confirmed > 0 ? `Confirmed: ${overviewStats.confirmed}` : 'Ready to receive'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6 bg-background border-border rounded-xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Transactions</p>
                    <p className="text-lg md:text-2xl font-bold text-foreground mt-2">{overviewStats.totalTransactions}</p>
                    <p className="text-xs text-primary mt-1">
                      {overviewStats.pending > 0 ? `Pending: ${overviewStats.pending}` : 'All clear'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6 bg-background border-border rounded-xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Avg. Order</p>
                    <p className="text-lg md:text-2xl font-bold text-foreground mt-2">
                      {overviewStats.averageAmount > 0 ? 
                        (showBalance ? `₹${(overviewStats.averageAmount * rate).toLocaleString('en-IN', {maximumFractionDigits: 2})}` : '•••') : 
                        '₹0'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {overviewStats.totalReceived > 0 ? 'Based on received transactions' : 'No activity yet'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6 bg-background border-border rounded-xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Success Rate</p>
                    <p className="text-lg md:text-2xl font-bold text-foreground mt-2">
                      {overviewStats.totalTransactions > 0 ? 
                        `${Math.round((overviewStats.confirmed / overviewStats.totalTransactions) * 100)}%` : 
                        '100%'
                      }
                    </p>
                    <p className="text-xs text-success mt-1">
                      {overviewStats.last30Days > 0 ? `Last 30d: ${overviewStats.last30Days}` : 'Ready to start'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Redesigned Total Balance Card */}
            <Card className="p-6 bg-background border-border rounded-xl shadow-md mb-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Total Balance</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl md:text-4xl font-bold text-foreground">
                        {showBalance ? `₹${convertETHToINR(balance || "0").toLocaleString()}` : '••••••••'}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${balanceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}> 
                      {balanceChange24h >= 0 ? '+' : ''}{balanceChange24h.toFixed(2)}% (24h)
                    </p>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ethereum</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        {showBalance ? `${formatEth(balance || "0", 8)} ETH` : '•••• ETH'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(balance || "0")}
                        title="Copy ETH value"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">INR Value</p>
                    <span className="text-base font-bold text-foreground">
                      {showBalance ? `₹${convertETHToINR(balance || "0").toLocaleString()}` : '••••••••'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Button
                    className="w-full flex items-center justify-center gap-2 h-12 text-base font-semibold"
                    onClick={() => setShowSendTransaction(true)}
                  >
                    <Send className="h-4 w-4" />
                    Send ETH
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 h-12 text-base font-semibold"
                    onClick={() => setShowReceiveQR(true)}
                  >
                    <Download className="h-4 w-4" />
                    Receive
                  </Button>
                </div>
              </div>
            </Card>

            {/* Balance History Chart */}
            <Card className="p-4 bg-background border-border rounded-xl shadow-md overflow-hidden">
              <h2 className="text-base md:text-lg font-semibold mb-2">Balance History</h2>
              <div className="w-full h-[180px] md:h-[220px] mt-2 overflow-x-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceHistory} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#E6E4DD" fontSize={10} />
                    <YAxis 
                      yAxisId="left" 
                      stroke="#8989DE" 
                      fontSize={10} 
                      tickFormatter={v => v >= 1 ? v.toFixed(2) : v.toFixed(4)} 
                      label={{ value: 'ETH', angle: -90, position: 'insideLeft', fill: '#8989DE' }} 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#4ade80" 
                      fontSize={10} 
                      tickFormatter={v => v >= 1 ? v.toLocaleString() : v.toFixed(2)} 
                      label={{ value: 'INR', angle: 90, position: 'insideRight', fill: '#4ade80' }} 
                    />
                    <Legend />
                    <RechartsTooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #404040', borderRadius: '8px' }}
                      labelStyle={{ color: '#E6E4DD' }}
                      itemStyle={{ color: '#8989DE' }}
                      formatter={(value, name) => {
                        if (name === 'ETH') return [parseFloat(String(value)).toFixed(8), 'ETH :'];
                        if (name === 'INR') return [parseFloat(String(value)).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }), 'INR :'];
                        return [String(value), String(name)];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="eth"
                      stroke="#8989DE"
                      strokeWidth={2}
                      dot={({ cx, cy, index }) => {
                        // Only show a dotted reference line for today's (last) data point
                        const isToday = index === balanceHistory.length - 1;
                        return (
                          <g key={`eth-dot-${index}`}> 
                            <circle cx={cx} cy={cy} r={2.5} fill="#8989DE" />
                            {isToday && (
                              <line x1={80} y1={cy} x2={cx} y2={cy} stroke="#8989DE" strokeDasharray="4 2" strokeWidth={1.5} />
                            )}
                          </g>
                        );
                      }}
                      name="ETH"
                      yAxisId="left"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inr" 
                      stroke="#4ade80" 
                      strokeWidth={2} 
                      dot={false} 
                      name="INR" 
                      yAxisId="right" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Exchange Rate Info */}
            <Card className="p-4 bg-background border-border rounded-xl shadow-md">
              <ExchangeRateDisplay />
            </Card>
          </div>
        );
      case 'payments':
        return (
          <TransactionHistory />
        );
      case 'qrcodes':
        return (
          <>
            <Card className="p-6 bg-background border-border rounded-xl shadow-md max-w-md mx-auto">
              <div className="flex flex-col items-center space-y-6">
                <h3 className="text-xl font-bold text-foreground mb-2">Receive Payments</h3>
                <p className="text-muted-foreground text-sm text-center">
                  Share this QR code or address to receive payments instantly
                </p>
                {/* QR Code Section */}
                <div className="bg-white p-6 rounded-lg border border-gray-700 cursor-pointer" onClick={() => setShowReceiveQR(true)}>
                  <div className="w-48 h-48 bg-black flex items-center justify-center relative mx-auto rounded">
                    <QRCodeCanvas
                      value={address || ''}
                      size={176}
                      bgColor="#000000"
                      fgColor="#ffffff"
                      level="H"
                      includeMargin={false}
                      style={{ width: '11rem', height: '11rem', borderRadius: '0.5rem' }}
                    />
                    {/* Center logo overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-gray-800 p-2 rounded">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Wallet Address Section */}
                <div className="space-y-2 w-full">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                    WALLET ADDRESS
                  </label>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 w-full flex items-center justify-between">
                    <div className="font-mono text-xs md:text-sm text-white break-all leading-relaxed">
                      {address}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(address || '')}
                      className="h-7 w-7 p-0 hover:bg-muted/20 ml-2"
                      title="Copy Address"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Network Info */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">NETWORK</div>
                    <div className="text-sm text-white mt-1">Sepolia</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">TYPE</div>
                    <div className="text-sm text-white mt-1">Ethereum</div>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      const url = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'wallet-qr.png';
                      link.click();
                    }
                  }}
                >
                  Download QR
                </Button>
              </div>
            </Card>
            {/* QR Code Modal */}
            <Dialog open={showReceiveQR && activeSection !== 'qrcodes'} onOpenChange={setShowReceiveQR}>
              <DialogContent className="w-full max-w-full md:max-w-md bg-black border border-gray-800 shadow-2xl rounded-none md:rounded-lg p-3 md:p-6 overflow-y-auto max-h-[90vh]">
                <DialogHeader className="pb-4 md:pb-6">
                  <DialogTitle className="flex items-center gap-3 text-lg md:text-xl font-medium text-white">
                    <QrCode className="h-5 w-5" />
                    Receive Payments
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 text-sm mt-1">
                    Share this QR code or address to receive payments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 md:space-y-6">
                  {/* QR Code Section */}
                  <div className="flex justify-center">
                    {address && (
                      <div className="bg-white p-6 rounded-lg border border-gray-700">
                        <div className="w-48 h-48 bg-black flex items-center justify-center relative mx-auto rounded">
                          <QRCodeCanvas
                            value={address}
                            size={176}
                            bgColor="#000000"
                            fgColor="#ffffff"
                            level="H"
                            includeMargin={false}
                            style={{ width: '11rem', height: '11rem', borderRadius: '0.5rem' }}
                          />
                          {/* Center logo overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-gray-800 p-2 rounded">
                              <Wallet className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            const canvas = document.querySelector('canvas');
                            if (canvas) {
                              const url = canvas.toDataURL('image/png');
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = 'wallet-qr.png';
                              link.click();
                            }
                          }}
                          className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded border border-gray-600 text-sm font-medium"
                        >
                          Download QR
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* Wallet Address Section */}
                  <div className="space-y-2 md:space-y-3">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                      WALLET ADDRESS
                    </label>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 md:p-4 flex items-center justify-between">
                      <div className="font-mono text-xs md:text-sm text-white break-all leading-relaxed">
                        {address}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(address || '')}
                        className="h-7 w-7 p-0 hover:bg-muted/20 ml-2"
                        title="Copy Address"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Network Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">NETWORK</div>
                      <div className="text-sm text-white mt-1">Sepolia</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">TYPE</div>
                      <div className="text-sm text-white mt-1">Ethereum</div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        );
      case 'customers':
        return (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Customer Management</h3>
                  <p className="text-sm text-muted-foreground">Track your customer interactions</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportCustomersToExcel}
                className="w-full md:w-auto border-border bg-background hover:bg-muted/20 text-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              <div className="p-4 bg-secondary/20 border border-border rounded-lg">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Total Customers</p>
                <p className="text-xl md:text-2xl font-bold text-foreground mt-2">{customerStats.totalCustomers}</p>
                <p className="text-xs text-success mt-1">+{customerStats.newCustomersThisMonth} this month</p>
              </div>
              <div className="p-4 bg-secondary/20 border border-border rounded-lg">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Returning Customers</p>
                <p className="text-xl md:text-2xl font-bold text-foreground mt-2">{customerStats.returningCustomerRate.toFixed(1)}%</p>
                <p className="text-xs text-primary mt-1">Based on repeat transactions</p>
              </div>
              <div className="p-4 bg-secondary/20 border border-border rounded-lg">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Avg. Customer Spend</p>
                <p className="text-xl md:text-2xl font-bold text-foreground mt-2">
                  {showBalance ? `${customerStats.averageSpend.toFixed(4)} ETH` : '•••••'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {showBalance ? `≈ ₹${(customerStats.averageSpend * rate).toLocaleString('en-IN', {maximumFractionDigits: 2})}` : '•••••'}
                </p>
              </div>
            </div>

            <Card className="mt-6">
              <div className="p-4 border-b border-border">
                <h4 className="text-sm font-medium">Recent Customers</h4>
              </div>
              <div className="divide-y divide-border">
                {customerStats.recentCustomers.length > 0 ? (
                  customerStats.recentCustomers.map((customer, index) => (
                    <div key={index} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 md:h-10 md:w-10">
                          <AvatarFallback>
                            {customer.address.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {formatAddress(customer.address)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(customer.address)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Last transaction: {new Date(customer.lastTransaction).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {customer.transactionCount} transactions
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total spent: {showBalance ? `${customer.totalSpent.toFixed(4)} ETH` : '•••••'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Add view customer details functionality
                          }}
                          className="w-full md:w-auto"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-muted/20 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No customer data available yet. Start processing transactions to see customer insights.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Merchant Settings</h3>
                <p className="text-sm text-muted-foreground">Manage your business preferences</p>
              </div>
            </div>
            <MerchantSettings activeTab={settingsTab} setActiveTab={setSettingsTab} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex max-w-full w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 z-30 h-screen hidden md:flex">
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen}
        >
          <SidebarBody className="flex flex-col h-full">
            {/* Scrollable upper part */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden ultra-minimal-scrollbar">
              {/* Desktop logo */}
              <div className={`flex items-center gap-4 mb-8 px-4 ${!sidebarOpen ? 'justify-center' : ''}`}>
                <div className="h-6 w-7 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: sidebarOpen ? 1 : 0,
                      display: sidebarOpen ? "block" : "none"
                    }}
                    className="font-medium text-foreground whitespace-pre"
                  >
                    CrypPal
                  </motion.span>
                )}
              </div>
              {/* Business Tools */}
              <div className={`mb-8 px-4 ${!sidebarOpen ? 'flex flex-col items-center px-0 mb-0' : ''}`}>
                {sidebarOpen && (
                  <motion.h3 
                    animate={{
                      opacity: sidebarOpen ? 1 : 0,
                      height: sidebarOpen ? "auto" : 0,
                      marginBottom: sidebarOpen ? "1rem" : 0,
                    }}
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide overflow-hidden"
                  >
                    Business Tools
                  </motion.h3>
                )}
                <div className={`flex flex-col gap-2 ${!sidebarOpen ? 'items-center' : ''}`}>
                  {sidebarLinks.map((link, idx) => (
                    <SidebarLink 
                      key={idx} 
                      link={link} 
                      onClick={() => {
                        setActiveSection(link.id);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`${activeSection === link.id ? 'bg-primary/10 text-primary' : ''} ${!sidebarOpen ? 'justify-center' : ''}`}
                    />
                  ))}
                </div>
              </div>
              {/* Quick Actions - Only show when expanded */}
              {sidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-8 px-4"
                >
                  <h3 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                    Quick Actions
                  </h3>
                  <div className="flex flex-col gap-2">
                    {quickActionLinks.map((link, idx) => (
                      <SidebarLink 
                        key={idx} 
                        link={{...link, icon: React.cloneElement(link.icon, { className: 'text-gray-400 h-5 w-5 flex-shrink-0' }) }}
                        onClick={link.action}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              {/* Security Status (now in scrollable part) */}
              {sidebarOpen && (
                <div className="mb-6 px-4">
                  <h3 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                    Security Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Seed Phrase</span>
                      <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs">Secured</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-lock</span>
                      <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs">Active</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Fixed bottom section */}
            {sidebarOpen ? (
              <div className="px-4 pb-6 space-y-4">
                {/* Connected Wallet Card */}
                <div>
                  <div className="bg-muted/40 rounded-xl shadow-sm border border-border p-4">
                    <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Connected Wallet</div>
                    {isConnected ? (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-sm font-mono flex-1">{address && formatAddress(address)}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPaymentQR(true)}
                            className="h-7 w-7 p-0 hover:bg-muted/20"
                            title="Show QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => copyToClipboard(address || '')}
                            className="h-7 w-7 p-0 hover:bg-muted/20"
                            title="Copy Address"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDisconnect}
                          className="w-full font-medium"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="w-full font-medium"
                        size="lg"
                        onClick={() => setShowWalletConnect(true)}
                      >
                        <Wallet className="h-5 w-5 mr-2" />
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                </div>
                {/* User Profile Card */}
                <div>
                  <div
                    className="bg-muted/40 rounded-xl shadow-sm border border-border flex items-center gap-4 p-4 cursor-pointer transition group hover:bg-muted/60 active:scale-[0.98]"
                    onClick={() => {
                      setActiveSection('settings');
                      if (window.innerWidth < 768) setMobileSidebarOpen(false);
                    }}
                    tabIndex={0}
                    aria-label="Go to settings"
                  >
                    <Avatar className="h-12 w-12 ring-2 ring-primary/30 group-hover:ring-primary">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground truncate">{getUserDisplayName()}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </SidebarBody>
        </Sidebar>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${sidebarOpen ? 'md:ml-[300px]' : 'md:ml-[60px]'} w-full`}>
        {/* Mobile Header */}
        <div className="bg-background border-b border-border flex-shrink-0 md:hidden w-full">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Hamburger menu opens mobile sidebar */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 md:hidden"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Manage your crypto payments</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveSection('settings')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setActiveSection('settings'); setSettingsTab('privacy'); }}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Security</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="bg-card flex-shrink-0 border-b border-border hidden md:block w-full">
          <div className="px-2 md:px-6 py-4 w-full">
            <div className="flex items-center justify-between gap-2 md:gap-4 w-full min-w-0 flex-wrap">
              {/* Left: Title and subtitle */}
              <div className="flex items-center gap-4 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="h-8 w-8 p-0 hidden md:flex"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-2xl font-bold text-foreground leading-tight truncate">Dashboard</h1>
                  <p className="text-sm text-muted-foreground leading-tight truncate">Manage your crypto payments</p>
                </div>
              </div>
              {/* Right: Controls */}
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                {/* Balance */}
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Balance:</span>
                  <Badge className="bg-secondary/20 text-muted-foreground border-border text-xs font-mono rounded-full px-3 py-1">
                    {showBalance ? `${formatEth(balance || "0", 8)} ETH` : '•••• ETH'}
                  </Badge>
                </div>
                {/* Refresh */}
                {isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshBalance}
                    className="h-8 w-8 p-0 hover:bg-muted/20 focus-visible:ring-2"
                    title="Refresh Balance"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                {/* Disconnect */}
                {isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="h-8 w-8 p-0 hover:bg-muted/20 focus-visible:ring-2"
                    title="Disconnect Wallet"
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                )}
                {/* Generate QR */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActiveSection('qrcodes')}
                  className="border-border bg-background hover:bg-muted/20 text-foreground focus-visible:ring-2 rounded-full px-3 py-1 hidden md:flex"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR
                </Button>
                {/* Send ETH */}
                {isConnected && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowSendTransaction(true)}
                    className="border-border bg-background hover:bg-muted/20 text-foreground focus-visible:ring-2 rounded-full px-3 py-1 hidden md:flex"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Send ETH
                  </Button>
                )}
                {/* Hide/Show Balance */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="h-8 w-8 p-0 hover:bg-muted/20 focus-visible:ring-2"
                  title={showBalance ? 'Hide Balance' : 'Show Balance'}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full focus-visible:ring-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveSection('settings')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setActiveSection('settings'); setSettingsTab('privacy'); }}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Security</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-2 md:p-6 pb-28 md:pb-6 overflow-y-auto overflow-x-auto w-full min-w-0">
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-2 md:gap-6">
            {renderMainContent()}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border flex justify-between items-center px-2 py-1 shadow-xl">
        <button
          className={`flex flex-col items-center flex-1 py-2 rounded-lg transition-all duration-150 ${activeSection === 'overview' ? 'text-white bg-primary/10' : 'text-muted-foreground'}`}
          onClick={() => setActiveSection('overview')}
        >
          <BarChart3 className="h-6 w-6 mb-0.5" />
          <span className="text-xs">Overview</span>
        </button>
        <button
          className={`flex flex-col items-center flex-1 py-2 rounded-lg transition-all duration-150 ${activeSection === 'payments' ? 'text-white bg-primary/10' : 'text-muted-foreground'}`}
          onClick={() => setActiveSection('payments')}
        >
          <Receipt className="h-6 w-6 mb-0.5" />
          <span className="text-xs">Payments</span>
        </button>
        <button
          className={`flex flex-col items-center flex-1 py-2 rounded-lg transition-all duration-150 ${activeSection === 'customers' ? 'text-white bg-primary/10' : 'text-muted-foreground'}`}
          onClick={() => setActiveSection('customers')}
        >
          <Users className="h-6 w-6 mb-0.5" />
          <span className="text-xs">Customers</span>
        </button>
        <button
          className={`flex flex-col items-center flex-1 py-2 rounded-lg transition-all duration-150 ${activeSection === 'settings' ? 'text-white bg-primary/10' : 'text-muted-foreground'}`}
          onClick={() => setActiveSection('settings')}
        >
          <Settings className="h-6 w-6 mb-0.5" />
          <span className="text-xs">Settings</span>
        </button>
      </div>

      {/* Wallet Modals */}
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

      {/* Mobile Sidebar Overlay (like UserDashboard) */}
      {mobileSidebarOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          {/* Sidebar */}
          <div className="fixed top-0 left-0 h-full w-[320px] max-w-full bg-card z-50 flex flex-col shadow-xl animate-slide-in-left overflow-y-auto overflow-x-hidden">
            {/* Close button and logo */}
            <div className="flex items-center justify-between px-4 pt-6 pb-2">
              <div className="flex items-center gap-4">
                <div className="h-6 w-7 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium text-foreground whitespace-pre"
                >
                  CrypPal
                </motion.span>
              </div>
              <button
                className="p-2 rounded-full hover:bg-muted focus:outline-none"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <Sidebar open={true} setOpen={() => setMobileSidebarOpen(false)}>
              <SidebarBody className="flex flex-col justify-between flex-1 overflow-y-auto overflow-x-hidden ultra-minimal-scrollbar">
                <div>
                  {/* Navigation Sections */}
                  <div className="mb-8 px-4">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
                      Business Tools
                    </h3>
                    <div className="flex flex-col gap-2">
                      {sidebarLinks.map((link, idx) => (
                        <SidebarLink 
                          key={idx} 
                          link={link} 
                          onClick={() => {
                            setActiveSection(link.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`${activeSection === link.id ? 'bg-primary/10 text-primary' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mb-8 px-4">
                    <h3 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                      Quick Actions
                    </h3>
                    <div className="flex flex-col gap-2">
                      {quickActionLinks.map((link, idx) => (
                        <SidebarLink 
                          key={idx} 
                          link={{...link, icon: React.cloneElement(link.icon, { className: 'text-gray-400 h-5 w-5 flex-shrink-0' }) }}
                          onClick={() => {
                            link.action();
                            setMobileSidebarOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Bottom Section: Security Status, Connected Wallet, User Profile */}
                <div className="px-4 pb-6 space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                      Security Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Seed Phrase</span>
                        <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs">Secured</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-lock</span>
                        <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs">Active</Badge>
                      </div>
                    </div>
                  </div>
                  {/* Connected Wallet Card */}
                  <div>
                    <div className="bg-muted/40 rounded-xl shadow-sm border border-border p-4">
                      <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Connected Wallet</div>
                      {isConnected ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="text-sm font-mono flex-1">{address && formatAddress(address)}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPaymentQR(true)}
                              className="h-7 w-7 p-0 hover:bg-muted/20"
                              title="Show QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => copyToClipboard(address || '')}
                              className="h-7 w-7 p-0 hover:bg-muted/20"
                              title="Copy Address"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDisconnect}
                            className="w-full font-medium"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="w-full font-medium"
                          size="lg"
                          onClick={() => setShowWalletConnect(true)}
                        >
                          <Wallet className="h-5 w-5 mr-2" />
                          Connect Wallet
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* User Profile Card */}
                  <div>
                    <div
                      className="bg-muted/40 rounded-xl shadow-sm border border-border flex items-center gap-4 p-4 cursor-pointer transition group hover:bg-muted/60 active:scale-[0.98]"
                      onClick={() => {
                        setActiveSection('settings');
                        if (window.innerWidth < 768) setMobileSidebarOpen(false);
                      }}
                      tabIndex={0}
                      aria-label="Go to settings"
                    >
                      <Avatar className="h-12 w-12 ring-2 ring-primary/30 group-hover:ring-primary">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-foreground truncate">{getUserDisplayName()}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SidebarBody>
            </Sidebar>
          </div>
        </>
      )}
    </div>
  );
};

export default MerchantDashboard;
