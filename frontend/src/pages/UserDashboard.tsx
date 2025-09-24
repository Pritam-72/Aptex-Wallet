import React, { useState, useEffect, useRef } from 'react';
import { Copy, Eye, EyeOff, Wallet, Send, Download, QrCode, ArrowUpDown, Plus, Settings, History, Shield, CreditCard, BarChart3, ExternalLink, Menu, ArrowLeftRight, RefreshCw, TrendingUp, Lock, Minus, X, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { WalletSetup } from '@/components/WalletSetup';
import { WalletConnect } from '@/components/WalletConnect';
import { SendTransaction } from '@/components/SendTransaction';
import { QRScanner } from '@/components/QRScannerNew';
import { TransactionHistory } from '@/components/TransactionHistoryReal';
import { SecuritySettings } from '@/components/SecuritySettings';
import { UserSettings } from '@/components/UserSettingsReal';
import { ethToInrSync, formatAddress, formatEth, copyToClipboard, getExchangeRateInfo } from '@/lib/utils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { ExchangeRateDisplay } from '@/components/ExchangeRateDisplay';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { getRealTransactions } from '@/services/getRealTransactions';
import PortfolioCard from '@/components/PortfolioCard';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isConnected, address, balance, isInitialized, isLoading, refreshBalance, disconnectWallet, getWalletInfo, hasWalletInDatabase } = useWallet();
  const { convertETHToINR, rate, isLive, lastUpdated, refresh: refreshRate } = useExchangeRate();
  const [showBalance, setShowBalance] = useState(true);
  const [activeSection, setActiveSection] = useState('wallet');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const [showReceiveQR, setShowReceiveQR] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [userTransactions, setUserTransactions] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [balanceChange24h, setBalanceChange24h] = useState(0);

  // Sync activeSection with ?section= param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [location.search]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    const fullName = user.user_metadata?.full_name || user.email;
    if (fullName && fullName !== user.email) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email.charAt(0).toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.user_metadata?.full_name || user.email.split('@')[0];
  };

  // Get user account type
  const getUserAccountType = () => {
    if (!user) return 'individual';
    return user.user_metadata?.account_type || 'individual';
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    // Check if wallet exists and show appropriate modal
    const checkWalletStatus = async () => {
      if (!isConnected && !showWalletSetup) {
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
  }, [isConnected, getWalletInfo, showWalletSetup, user]);

  useEffect(() => {
    // Refresh balance periodically if connected
    if (isConnected) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isConnected, refreshBalance]);

  useEffect(() => {
    if (isConnected && address) {
      getRealTransactions(address).then(setUserTransactions);
    }
  }, [isConnected, address, refreshFlag]);

  useEffect(() => {
    // Store daily balance snapshot in localStorage
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

  useEffect(() => {
    // Build balance history from daily snapshots (last 7 days)
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

  useEffect(() => {
    // Calculate real 24h change in INR value
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
    // Don't show connect dialog immediately after setup
  };
  const handleDisconnect = () => {
    disconnectWallet();
    setShowWalletConnect(true);
  };

  // Callback to trigger after any payment
  const handlePaymentComplete = () => {
    setRefreshFlag(f => f + 1);
  };

  // Add QR code generation for the wallet address
  const generateAddressQR = () => {
    setShowReceiveQR(true);
  };  // Replace the mock AddressQRCode with a real QR code
  const AddressQRCode = ({ address }: { address: string }) => {
    const qrRef = useRef<HTMLCanvasElement>(null);

    const handleDownload = () => {
      const canvas = qrRef.current;
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wallet-qr.png';
        link.click();
      }
    };

    return (
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
            ref={qrRef}
          />
          {/* Center logo overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gray-800 p-2 rounded">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded border border-gray-600 text-sm font-medium"
        >
          Download QR
        </button>
      </div>
    );
  };

  const exportTransactionsToExcel = () => {
    try {
      console.log('Starting export...', transactions);
      
      // Prepare data for export
      const exportData = transactions.map(transaction => ({
        'ID': transaction.id,
        'Merchant': transaction.merchant,
        'Amount_ETH': transaction.amount,
        'Amount_INR': transaction.fiatAmount,
        'Status': transaction.status,
        'Time': transaction.time,
        'Type': transaction.type
      }));

      console.log('Export data prepared:', exportData);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      console.log('Worksheet created:', worksheet);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      console.log('Worksheet added to workbook');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `crypPal_user_transactions_${currentDate}.xlsx`;

      console.log('Attempting to save file:', filename);

      // Save file
      XLSX.writeFile(workbook, filename);
      
      console.log('Export completed successfully');
      
      // Show success toast
      toast.success('Transactions exported successfully!', {
        action: {
          label: '✕',
          onClick: () => toast.dismiss()
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message}`, {
        action: {
          label: '✕',
          onClick: () => toast.dismiss()
        }
      });
    }
  };

  const exportWalletDataToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      // Use real userTransactions
      const transactionsData = userTransactions.map(tx => ({
        'Type': tx.type,
        'From': tx.from,
        'To': tx.to,
        'ETH Amount': tx.ethAmount,
        'INR Amount': tx.inrAmount,
        'Date': tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : '',
        'Time': tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : '',
        'Tx Hash': tx.txHash,
      }));
      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Payment History');
      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `crypPal_payment_history_${dateStr}.xlsx`;
      // Save file
      XLSX.writeFile(workbook, filename);
      toast.success('Payment history exported successfully!', {
        action: {
          label: '✕',
          onClick: () => toast.dismiss()
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message}`, {
        action: {
          label: '✕',
          onClick: () => toast.dismiss()
        }
      });
    }
  };

  const exportAnalyticsToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Monthly spending data
      const monthlyData = [
        { 'Month': 'Current Month', 'Amount': '₹12,450', 'Change': '+15%', 'Transactions': '47' },
        { 'Month': 'Last Month', 'Amount': '₹10,825', 'Change': '+8%', 'Transactions': '39' },
        { 'Month': 'Two Months Ago', 'Amount': '₹10,020', 'Change': '+3%', 'Transactions': '35' }
      ];
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Summary');

      // Category breakdown
      const categoryData = [
        { 'Category': 'Food & Dining', 'Amount': '₹5,200', 'Transactions': '18', 'Average': '₹289' },
        { 'Category': 'Shopping', 'Amount': '₹4,100', 'Transactions': '12', 'Average': '₹342' },
        { 'Category': 'Coffee', 'Amount': '₹3,150', 'Transactions': '17', 'Average': '₹185' }
      ];
      const categorySheet = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Breakdown');

      // Transaction frequency
      const frequencyData = [
        { 'Period': 'This Week', 'Transactions': '8', 'Amount': '₹2,120' },
        { 'Period': 'Last Week', 'Transactions': '12', 'Amount': '₹3,180' },
        { 'Period': 'Week Before', 'Transactions': '9', 'Amount': '₹2,450' }
      ];
      const frequencySheet = XLSX.utils.json_to_sheet(frequencyData);
      XLSX.utils.book_append_sheet(workbook, frequencySheet, 'Transaction Frequency');

      // Generate filename
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `crypPal_analytics_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);
      
      toast.success('Analytics data exported successfully!', {
        action: {
          label: '✕',
          onClick: () => toast.dismiss()
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message}`, {
        action: {
          label: '✕',
          onClick: () => toast.dismiss()
        }
      });
    }
  };
  const transactions = [
    {
      id: 1,
      merchant: 'Coffee House',
      amount: '0.002 ETH',
      fiatAmount: '₹500',
      time: '5 mins ago',
      status: 'Confirmed',
      type: 'payment',
      icon: '☕'
    },
    {
      id: 2,
      merchant: 'Online Store',
      amount: '0.015 ETH',
      fiatAmount: '₹3,750',
      time: '2 hours ago',
      status: 'Confirmed',
      type: 'payment',
      icon: '🛍️'
    },
    {
      id: 3,
      merchant: 'Food Truck',
      amount: '0.008 ETH',
      fiatAmount: '₹2,000',
      time: 'Yesterday',
      status: 'Confirmed',
      type: 'payment',
      icon: '🍔'
    }
  ];
  const sidebarSections = [
    { id: 'wallet', label: 'My Wallet', icon: Wallet },
    { id: 'scan', label: 'Scan & Pay', icon: ArrowUpDown },
    { id: 'history', label: 'Payment History', icon: History },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarLinks = [
    {
      label: 'My Wallet',
      href: '#',
      icon: <Wallet className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'wallet'
    },
    {
      label: 'Scan & Pay',
      href: '#',
      icon: <Send className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'scan'
    },
    {
      label: 'Payment History',
      href: '#',
      icon: <History className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'history'
    },
    {
      label: 'Security',
      href: '#',
      icon: <Shield className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'security'
    },
    {
      label: 'Settings',
      href: '#',
      icon: <Settings className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'settings'
    },
  ];  const quickActionLinks = [
    {
      label: 'Send ETH',
      href: '#',
      icon: <Send className="text-foreground h-5 w-5 flex-shrink-0" />,
      action: () => setActiveSection('scan')
    },
    {
      label: 'Receive',
      href: '#',
      icon: <Download className="text-foreground h-5 w-5 flex-shrink-0" />,
      action: () => generateAddressQR()
    },
    {
      label: 'Market',
      href: '#',
      icon: <TrendingUp className="text-foreground h-5 w-5 flex-shrink-0" />,
      action: () => window.location.href = '/market'
    },
    {
      label: 'Export Data',
      href: '#',
      icon: <Download className="text-foreground h-5 w-5 flex-shrink-0" />,
      action: () => setShowExportDialog(true)
    },
    {
      label: 'View on Explorer',
      href: '#',
      icon: <ExternalLink className="text-foreground h-5 w-5 flex-shrink-0" />,
      action: () => address && window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')
    },
  ];

  const renderMainContent = () => {
    switch (activeSection) {
      case 'wallet':
        return (
          <>
            {/* Connect Wallet Banner - Minimal Style */}
            {!isConnected && (
              <Card className="mb-4 border border-border bg-muted/40 flex items-center gap-3 p-3">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Connect your wallet</p>
                  <p className="text-xs text-muted-foreground">Connect your wallet to view your balance.</p>
                </div>
                <Button
                  onClick={() => setShowWalletConnect(true)}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground bg-background hover:bg-muted/30 px-4 py-1"
                >
                  <Wallet className="h-4 w-4 mr-1" />
                  Connect
                </Button>
              </Card>
            )}
            <Card className="p-2 md:p-6 rounded-t-xl md:rounded-lg">
              {/* Main Wallet Balance Card */}
              <div className="space-y-4 md:space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
                  <p className="text-2xl md:text-4xl font-bold">
                    {showBalance ? (balance ? `₹${convertETHToINR(balance).toLocaleString()}` : '₹0.00') : '••••••••'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {balanceChange24h > 0 && '+'}{balanceChange24h.toFixed(2)}% (24h)
                  </p>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 md:p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                    <div>
                      <p className="text-sm text-muted-foreground">Ethereum</p>
                      <p className="text-lg md:text-xl font-semibold">
                        {showBalance ? (balance ? `${formatEth(balance, 8)} ETH` : '0.00000000 ETH') : '•••• ETH'}
                      </p>
                    </div>
                    <div className="md:text-right">
                      <p className="text-sm text-muted-foreground">INR Value</p>
                      <p className="text-base md:text-lg font-medium">
                        {showBalance ? (balance ? `₹${convertETHToINR(balance).toLocaleString()}` : '₹0.00') : '••••••••'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons - Stack vertically on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
                  <Button 
                    className="w-full h-14" 
                    size="lg" 
                    onClick={() => setShowSendTransaction(true)}
                    disabled={!isConnected}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send ETH
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="w-full">
                          <Button 
                            className="w-full h-14" 
                            size="lg" 
                            onClick={generateAddressQR}
                            disabled={!isConnected}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Receive
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!isConnected && (
                        <TooltipContent side="top">Connect your wallet to receive funds.
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              {/* Portfolio Balance History Chart */}
              <div className="mt-6 md:mt-8">
                <div className="glass-card p-3 md:p-4 rounded-lg animate-fade-in">
                  <h2 className="text-base md:text-lg font-semibold mb-2">Balance History</h2>
                  <div className="w-full h-[180px] md:h-[220px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={balanceHistory} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                        <XAxis dataKey="date" stroke="#E6E4DD" fontSize={10} />
                        <YAxis yAxisId="left" stroke="#8989DE" fontSize={10} tickFormatter={v => v >= 1 ? v.toFixed(2) : v.toFixed(4)} label={{ value: 'ETH', angle: -90, position: 'insideLeft', fill: '#8989DE' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#4ade80" fontSize={10} tickFormatter={v => v >= 1 ? v.toLocaleString() : v.toFixed(2)} label={{ value: 'INR', angle: 90, position: 'insideRight', fill: '#4ade80' }} />
                        <RechartsTooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #404040', borderRadius: '8px' }} labelStyle={{ color: '#E6E4DD' }} itemStyle={{ color: '#8989DE' }}
                          formatter={(value, name) => {
                            if (name === 'ETH') return [parseFloat(String(value)).toFixed(8), 'ETH :'];
                            if (name === 'INR') return [parseFloat(String(value)).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }), 'INR :'];
                            return [value, name];
                          }}
                        />
                        <Legend />
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
                        <Line type="monotone" dataKey="inr" stroke="#4ade80" strokeWidth={2} dot={false} name="INR" yAxisId="right" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Exchange Rate Info */}
              <Card className="p-3 md:p-4 mt-4 rounded-lg">
                <ExchangeRateDisplay />
              </Card>
            </Card>
          </>
        );
      
      case 'scan':
        return (
          <>
            {/* Connect Wallet Banner - Minimal Style for Scan Section */}
            {!isConnected && (
              <Card className="mb-4 border border-border bg-muted/40 flex items-center gap-3 p-3">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Connect your wallet</p>
                  <p className="text-xs text-muted-foreground">Connect your wallet to scan and pay.</p>
                </div>
                <Button
                  onClick={() => setShowWalletConnect(true)}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground bg-background hover:bg-muted/30 px-4 py-1"
                >
                  <Wallet className="h-4 w-4 mr-1" />
                  Connect
                </Button>
              </Card>
            )}
            <div className="w-full max-w-md mx-auto p-2 md:p-0">
              <QRScanner 
                onScan={(data) => {
                  console.log('QR Data scanned:', data);
                }}
                onPaymentComplete={handlePaymentComplete}
                onSuccessDialogClose={() => setActiveSection('wallet')}
                onClose={() => setActiveSection('wallet')}
                scanButtonProps={{
                  disabled: !isConnected,
                  tooltip: !isConnected ? 'Connect your wallet to use this feature.' : undefined
                }}
                uploadButtonProps={{
                  disabled: !isConnected,
                  tooltip: !isConnected ? 'Connect your wallet to use this feature.' : undefined
                }}
              />
            </div>
          </>
        );
      
      case 'history':
        return <TransactionHistory refreshFlag={refreshFlag} />;
      
      case 'security':
        return <SecuritySettings />;
        
      case 'settings':
        return <UserSettings onLogout={handleSignOut} />;

      default:
        return null;
    }
  };

  useEffect(() => {
    // Ensure sidebar is open by default on desktop, closed on mobile
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background flex w-full border border-border overflow-hidden">
      {/* Sidebar - Desktop: flex child, Mobile: overlay */}
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ultra-minimal-scrollbar">
              {/* Desktop logo */}
              <div className="hidden md:flex items-center gap-4 mb-8 px-4">
                <div className="h-6 w-7 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium text-foreground whitespace-pre"
                >
                  CrypPal
                </motion.span>
              </div>
              
              {/* Wallet Features */}
              <div className="mb-8 px-4">
                <motion.h3 
                  animate={{
                    opacity: sidebarOpen ? 1 : 0,
                    height: sidebarOpen ? "auto" : 0,
                    marginBottom: sidebarOpen ? "1rem" : 0,
                  }}
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide overflow-hidden"
                >
                  Wallet Features
                </motion.h3>
                <div className="flex flex-col gap-2">
                  {sidebarLinks.map((link, idx) => (
                    <SidebarLink 
                      key={idx} 
                      link={link} 
                      onClick={() => {
                        setActiveSection(link.id);
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
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

              {/* Security Status - Only show when expanded */}
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4"
                >
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
                </motion.div>
              )}
            </div>
            
            <div className="pt-4 px-4">
              {isConnected ? (
                <div className="space-y-2">
                  {sidebarOpen && (
                    <>
                      <div className="text-xs text-gray-500">Connected Wallet</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-mono flex-1">{address && formatAddress(address)}</div>
                        {/* Add QR icon next to wallet address */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateAddressQR}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                          title="Show QR Code"
                        >
                          <QrCode className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => {
                            copyToClipboard(address || '');
                            toast.success('Copied!', {
                              action: {
                                label: '✕',
                                onClick: () => toast.dismiss(),
                              }
                            });
                          }}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                          title="Copy Address"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                  {sidebarOpen ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center mb-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleDisconnect}
                              className="h-10 w-10 flex items-center justify-center"
                              title="Disconnect"
                            >
                              <Lock className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">Disconnect</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              ) : (
                sidebarOpen ? (
                  <Button
                    onClick={() => setShowWalletConnect(true)}
                    className="w-full"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                ) : (
                  <div className="flex flex-col items-center mb-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setShowWalletConnect(true)}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 flex items-center justify-center"
                            title="Connect Wallet"
                          >
                            <Wallet className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Connect Wallet</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )
              )}
              
              {sidebarOpen && (
                <button
                  className="mt-4 border-t border-border pt-4 w-full text-left focus:outline-none group"
                  onClick={() => {
                    setActiveSection('settings');
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  tabIndex={0}
                  aria-label="Go to user settings"
                >
                  <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                    User Profile
                  </h3>
                  <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-xl shadow-sm transition-all group-hover:bg-muted/60 group-active:scale-[0.98] cursor-pointer border border-transparent group-hover:border-primary/30">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/30 group-hover:ring-primary">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground truncate">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </SidebarBody>
        </Sidebar>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-[300px]' : 'md:ml-[60px]'}`}>
        {/* Header */}
        <div className="bg-card flex-shrink-0 border-b border-border">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile hamburger menu */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="h-8 w-8 p-0 md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                {/* Desktop sidebar toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="h-8 w-8 p-0 hidden md:flex"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div>
                  <h1 className="text-lg md:text-xl font-semibold">Dashboard</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Manage your digital assets</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3">
                {/* Balance - Hide on mobile to save space */}
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Balance:</span>
                  <Badge variant="secondary" className="font-mono">
                    {showBalance ? (balance ? `${formatEth(balance)} ETH` : '0.0000 ETH') : '•••• ETH'}
                  </Badge>
                </div>
                
                {isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshBalance}
                    className="hidden md:flex"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowQRScanner(true)}
                  className="hidden md:flex"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="h-8 w-8 p-0"
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>

                {/* Profile Dropdown */}
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
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveSection('security')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Security</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-2 md:p-6 pb-20">
          {renderMainContent()}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className={`fixed inset-0 z-50 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        {/* Mobile overlay */}
        <div 
          className="fixed inset-0 bg-black/50" 
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar content */}
        <div className="relative h-full w-full bg-card">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ultra-minimal-scrollbar">
                {/* Mobile logo */}
                <div className="flex items-center gap-4 mb-8 px-4">
                  <div className="h-6 w-7 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium text-foreground whitespace-pre"
                  >
                    CrypPal
                  </motion.span>
                </div>
                
                {/* Wallet Features */}
                <div className="mb-8 px-4">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
                    Wallet Features
                  </h3>
                  <div className="flex flex-col gap-2">
                    {sidebarLinks.map((link, idx) => (
                      <SidebarLink 
                        key={idx} 
                        link={link} 
                        onClick={() => {
                          setActiveSection(link.id);
                          setSidebarOpen(false);
                        }}
                        className={`${activeSection === link.id ? 'bg-primary/10 text-primary' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Quick Actions */}
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
                          setSidebarOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Security Status */}
                <div className="px-4">
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
              </div>
              
              <div className="pt-4 px-4">
                {isConnected ? (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Connected Wallet</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-mono flex-1">{address && formatAddress(address)}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateAddressQR}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                        title="Show QR Code"
                      >
                        <QrCode className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => {
                          copyToClipboard(address || '');
                          toast.success('Copied!', {
                            action: {
                              label: '✕',
                              onClick: () => toast.dismiss(),
                            }
                          });
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                        title="Copy Address"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowWalletConnect(true)}
                    className="w-full"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
                
                <button
                  className="mt-4 border-t border-border pt-4 w-full text-left focus:outline-none group"
                  onClick={() => {
                    setActiveSection('settings');
                    setSidebarOpen(false);
                  }}
                  tabIndex={0}
                  aria-label="Go to user settings"
                >
                  <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                    User Profile
                  </h3>
                  <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-xl shadow-sm transition-all group-hover:bg-muted/60 group-active:scale-[0.98] cursor-pointer border border-transparent group-hover:border-primary/30">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/30 group-hover:ring-primary">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground truncate">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </SidebarBody>
          </Sidebar>
        </div>
      </div>

      {/* Receive QR Modal */}
      <Dialog open={showReceiveQR} onOpenChange={setShowReceiveQR}>
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
              {address && <AddressQRCode address={address} />}
            </div>
            
            {/* Wallet Address Section */}
            <div className="space-y-2 md:space-y-3">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                WALLET ADDRESS
              </label>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 md:p-4">
                <div className="font-mono text-xs md:text-sm text-white break-all leading-relaxed">
                  {address}
                </div>
              </div>
            </div>
            
            {/* Network Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  NETWORK
                </label>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                  <span className="text-white text-sm">Sepolia</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  TYPE
                </label>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                  <span className="text-white text-sm">Ethereum</span>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <Button
              onClick={() => {
                copyToClipboard(address || '');
                toast.success('Copied!', {
                  action: {
                    label: '✕',
                    onClick: () => toast.dismiss(),
                  }
                });
              }}
              className="w-full h-12 md:h-11 bg-gray-700 hover:bg-gray-600 text-white border-0 font-medium"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
            
            {/* Warning */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 md:p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium mb-1">Security Notice</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    This address can receive ETH and ERC-20 tokens on Ethereum network. Always verify the network before sending funds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
        onPaymentComplete={handlePaymentComplete}
      />

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="w-full max-w-full md:max-w-md rounded-none md:rounded-lg p-3 md:p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Export Payment History</DialogTitle>
            <DialogDescription>
              This will export your payment history as an Excel file.<br/>
              Are you sure you want to export your payment history?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col md:flex-row gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowExportDialog(false)} className="w-full md:w-auto h-12 md:h-10">
              Cancel
            </Button>
            <Button onClick={() => { setShowExportDialog(false); exportWalletDataToExcel(); }} className="w-full md:w-auto h-12 md:h-10">
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="w-full max-w-full md:max-w-md rounded-none md:rounded-2xl p-0 custom-thin-outline overflow-y-auto max-h-[90vh]">
          <QRScanner
            onClose={() => setShowQRScanner(false)}
            cardClassName="rounded-none md:rounded-xl p-4 md:p-6"
            showCloseButton={false}
          />
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border flex justify-between items-center px-2 py-1 shadow-xl">
        <button
          className={`flex flex-col items-center flex-1 py-2 rounded-lg transition-all duration-150 ${activeSection === 'wallet' ? 'text-white bg-primary/10' : 'text-muted-foreground'}`}
          onClick={() => setActiveSection('wallet')}
        >
          <Wallet className="h-6 w-6 mb-0.5" />
          <span className="text-xs">Wallet</span>
        </button>
        <button
          className={`flex flex-col items-center flex-1 py-2 rounded-lg transition-all duration-150 ${activeSection === 'scan' ? 'text-white bg-primary/10' : 'text-muted-foreground'}`}
          onClick={() => setActiveSection('scan')}
        >
          <Send className="h-6 w-6 mb-0.5" />
          <span className="text-xs">Scan</span>
        </button>
        <button
          className={`flex flex-col items-center flex-1 py-2 rounded-lg transition-all duration-150 ${activeSection === 'history' ? 'text-white bg-primary/10' : 'text-muted-foreground'}`}
          onClick={() => setActiveSection('history')}
        >
          <History className="h-6 w-6 mb-0.5" />
          <span className="text-xs">History</span>
        </button>
        <button
          className={`flex flex-col items-center flex-1 py-2 rounded-lg transition-all duration-150 ${activeSection === 'settings' ? 'text-white bg-primary/10' : 'text-muted-foreground'}`}
          onClick={() => setActiveSection('settings')}
        >
          <Settings className="h-6 w-6 mb-0.5" />
          <span className="text-xs">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default UserDashboard;
