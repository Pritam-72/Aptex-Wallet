import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, Wallet, Send, QrCode, RefreshCw, Settings, History, Shield, CreditCard, BarChart3, ExternalLink, Menu, TrendingUp, Lock, Plus, Minus, ArrowUpDown, X, Bug, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { WalletSetup } from '@/components/WalletSetup';
import { WalletConnect } from '@/components/WalletConnect';
import { SendTransaction } from '@/components/SendTransaction';
import { WalletLoginDiagnostics } from '@/components/WalletLoginDiagnostics';
import * as XLSX from 'xlsx';
import WalletInfo from '@/components/WalletInfo';

const EnhancedUserDashboard = () => {
  const navigate = useNavigate();
  const { isConnected, address, balance, refreshBalance, disconnectWallet, getWalletInfo, hasWalletInDatabase } = useWallet();
  const { user, signOut } = useAuth();
    const [showBalance, setShowBalance] = useState(true);
  const [activeSection, setActiveSection] = useState('wallet');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const [showReceiveQR, setShowReceiveQR] = useState(false);

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
    // Refresh balance periodically if connected
    if (isConnected) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, refreshBalance]);

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

  const handleLogout = async () => {
    try {
      // First disconnect the wallet to clean up any wallet-related state
      if (isConnected) {
        disconnectWallet();
      }
      // Then sign out from authentication
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still attempt to sign out even if wallet disconnect fails
      await signOut();
    }
  };

  // Add QR code generation for the wallet address
  const generateAddressQR = () => {
    setShowReceiveQR(true);
  };  // Mock QR code component (you can replace with a real QR generator)
  const AddressQRCode = ({ address }: { address: string }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-700">
      <div className="w-48 h-48 bg-black flex items-center justify-center relative mx-auto rounded">
        {/* Enhanced QR-like pattern */}
        <div className="grid grid-cols-12 gap-0.5 w-44 h-44">
          {Array.from({ length: 144 }, (_, i) => {
            const isCorner = (i < 36 && (i % 12) < 3) || 
                           (i < 36 && (i % 12) > 8) || 
                           (i > 107 && (i % 12) < 3);
            const isCenter = i >= 66 && i <= 77 && (i % 12) >= 5 && (i % 12) <= 6;
            
            return (
              <div
                key={i}
                className={`aspect-square ${
                  isCorner || isCenter 
                    ? 'bg-black' 
                    : Math.random() > 0.6 ? 'bg-white' : 'bg-black'
                }`}
              />
            );
          })}
        </div>
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-orange-500 p-2 rounded">
            <Wallet className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  // Mock data for transactions
  const transactions = [
    {
      id: 'tx_001',
      type: 'sent',
      merchant: 'Coffee Shop',
      amount: '0.05',
      fiatAmount: '₹125.50',
      status: 'completed',
      time: '2 mins ago',
      hash: '0x1234...5678'
    },
    {
      id: 'tx_002', 
      type: 'received',
      merchant: 'Salary Credit',
      amount: '0.5',
      fiatAmount: '₹1,255.00',
      status: 'completed',
      time: '1 hour ago',
      hash: '0x2345...6789'
    },
    {
      id: 'tx_003',
      type: 'sent',
      merchant: 'Online Store',
      amount: '0.12',
      fiatAmount: '₹301.20',
      status: 'pending',
      time: '3 hours ago',
      hash: '0x3456...7890'
    }
  ];

  const exportTransactionsToExcel = () => {
    try {
      const exportData = transactions.map(transaction => ({
        'ID': transaction.id,
        'Type': transaction.type,
        'Merchant': transaction.merchant,
        'Amount_ETH': transaction.amount,
        'Amount_INR': transaction.fiatAmount,
        'Status': transaction.status,
        'Time': transaction.time,
        'Hash': transaction.hash
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      XLSX.writeFile(workbook, `cryppal_transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const sidebarLinks = [
    {
      label: "Wallet",
      href: "#",
      icon: <Wallet className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('wallet')
    },
    {
      label: "Send",
      href: "#",
      icon: <Send className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setShowSendTransaction(true)
    },
    {
      label: "Transactions",
      href: "#",
      icon: <History className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('transactions')
    },
    {
      label: "Portfolio",
      href: "#",
      icon: <BarChart3 className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('portfolio')
    },
    {
      label: "Security",
      href: "#",
      icon: <Shield className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('security')
    },
    {
      label: "Diagnostics",
      href: "#",
      icon: <Bug className="text-neutral-700 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveSection('diagnostics')
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ultra-minimal-scrollbar">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">CrypPal</span>
            </div>
            
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>            <div className="pt-4">
            {isConnected ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Connected Wallet</div>                <div className="flex items-center gap-2">
                  <div className="text-sm font-mono flex-1">{address && formatAddress(address)}</div>
                  {/* Add QR icon next to wallet address */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateAddressQR}
                    className="h-8 w-8 p-1 hover:bg-gray-100"
                    title="Show QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(address || '')}
                    className="h-8 w-8 p-1 hover:bg-gray-100"
                    title="Copy Address"
                  >
                    <Copy className="h-4 w-4" />
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
            
            {/* Logout Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
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
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <Button
                    variant="outline"
                    onClick={refreshBalance}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  {/* Add QR button in header as well */}
                  <Button
                    variant="outline"
                    onClick={generateAddressQR}
                    className="flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Receive
                  </Button>
                </>
              )}
              
              {/* User Menu */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{user?.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
          {!isConnected && (
            <div className="mb-6 border border-border bg-secondary/20 rounded-lg p-4 flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-muted/20 flex items-center justify-center flex-shrink-0">
                <Wallet className="h-3 w-3 text-muted-foreground" />
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

          {/* Wallet Section */}
          {activeSection === 'wallet' && (
            <div className="space-y-6">
              {/* Enhanced Wallet Information */}
              {isConnected && address && (
                <WalletInfo
                  address={address}
                  balance={balance || undefined}
                  network="sepolia"
                  isConnected={isConnected}
                  onRefresh={refreshBalance}
                  onDisconnect={handleDisconnect}
                />
              )}

              {/* Balance Card - Keep for legacy or additional info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Wallet Balance
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
                        {showBalance ? (balance ? `${parseFloat(balance).toFixed(8)} ETH` : '0.00000000 ETH') : '••••••'}
                      </div>
                      <div className="text-gray-600">
                        {showBalance ? (balance ? `≈ ₹${(parseFloat(balance) * 251100).toFixed(2)}` : '≈ ₹0.00') : '••••••'}
                      </div>
                    </div>
                      {address && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Wallet Address</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(address)}
                              className="h-6 w-6 p-1"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={generateAddressQR}
                              className="h-6 w-6 p-1"
                            >
                              <QrCode className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="font-mono text-sm text-gray-800 break-all bg-white p-2 rounded border">
                          {address}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="w-full" onClick={() => setShowSendTransaction(true)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                      <Button variant="outline" className="w-full" onClick={generateAddressQR}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Receive
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowSendTransaction(true)}>
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <Send className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <div className="font-medium">Send ETH</div>
                      <div className="text-sm text-gray-500">Transfer to others</div>
                    </div>
                  </CardContent>
                </Card>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={generateAddressQR}>
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <QrCode className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <div className="font-medium">Receive</div>
                      <div className="text-sm text-gray-500">Show QR code</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection('transactions')}>
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <History className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <div className="font-medium">History</div>
                      <div className="text-sm text-gray-500">View transactions</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions Preview */}
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
                    {transactions.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-gray-200`}>
                            {tx.type === 'sent' ? 
                              <Minus className="h-4 w-4 text-gray-500" /> : 
                              <Plus className="h-4 w-4 text-gray-500" />
                            }
                          </div>
                          <div>
                            <div className="font-medium">{tx.merchant}</div>
                            <div className="text-sm text-gray-500">{tx.time}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-500">
                            {tx.type === 'sent' ? '-' : '+'}{tx.amount} ETH
                          </div>
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

          {/* Transactions Section */}
          {activeSection === 'transactions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Transaction History</h2>
                <Button onClick={exportTransactionsToExcel} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {transactions.map((tx, index) => (
                      <div key={tx.id} className={`p-4 ${index !== transactions.length - 1 ? 'border-b' : ''}`}> 
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-gray-200">
                              {tx.type === 'sent' ? 
                                <Send className="h-5 w-5 text-gray-500" /> : 
                                <TrendingUp className="h-5 w-5 text-gray-500" />
                              }
                            </div>
                            <div>
                              <div className="font-medium">{tx.merchant}</div>
                              <div className="text-sm text-gray-500">{tx.time}</div>
                              <div className="text-xs font-mono text-gray-400">{tx.hash}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-medium text-gray-500">
                              {tx.type === 'sent' ? '-' : '+'}{tx.amount} ETH
                            </div>
                            <div className="text-sm text-gray-500">{tx.fiatAmount}</div>
                            <Badge 
                              variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}
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

          {/* Portfolio Section */}
          {activeSection === 'portfolio' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Portfolio Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {balance ? `₹${(parseFloat(balance) * 251100).toFixed(2)}` : '₹0.00'}
                    </div>
                    <div className="text-sm text-gray-400">+2.5% today</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ETH Holdings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH'}
                    </div>
                    <div className="text-sm text-gray-400">≈ $3,200</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{transactions.length}</div>
                    <div className="text-sm text-gray-400">This month</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Security Settings</h2>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Wallet Security
                    </CardTitle>
                    <CardDescription>
                      Manage your wallet security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Wallet Encrypted</div>
                        <div className="text-sm text-gray-600">Your wallet is securely encrypted</div>
                      </div>
                      <Badge>Enabled</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Network</div>
                        <div className="text-sm text-gray-600">Sepolia Testnet</div>
                      </div>
                      <Badge variant="secondary">Testnet</Badge>
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Diagnostics Section */}
          {activeSection === 'diagnostics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Wallet Diagnostics</h2>
              <WalletLoginDiagnostics />
            </div>
          )}
        </div>
      </div>

      {/* Receive QR Modal */}
      <Dialog open={showReceiveQR} onOpenChange={setShowReceiveQR}>
        <DialogContent className="max-w-md bg-black border border-gray-800">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-medium text-white">
              <QrCode className="h-5 w-5" />
              Receive Payments
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm mt-1">
              Share this QR code or address to receive payments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="flex justify-center">
              {address && <AddressQRCode address={address} />}
            </div>
            {/* Wallet Address Section */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                WALLET ADDRESS
              </label>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="font-mono text-sm text-white break-all">
                  {address}
                </div>
              </div>
            </div>
            {/* Network Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">NETWORK</div>
                <div className="text-sm text-white mt-1">Sepolia</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">TYPE</div>
                <div className="text-sm text-white mt-1">Ethereum</div>
              </div>
            </div>
            {/* Copy Button */}
            <Button 
              onClick={() => copyToClipboard(address || '')}
              className="w-full h-11 bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
            {/* Security Notice */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-2">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Security Notice</div>
                  <div className="text-xs text-gray-500 mt-1">
                    This address can receive ETH and ERC-20 tokens on Ethereum network. Always verify the network before sending funds.
                  </div>
                </div>
              </div>
            </div>
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
    </div>
  );
};

export default EnhancedUserDashboard;
