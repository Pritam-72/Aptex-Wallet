import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, Wallet, Send, QrCode, RefreshCw, Settings, History, Shield, CreditCard, BarChart3, ExternalLink, Menu, TrendingUp, Lock, Plus, Minus, ArrowUpDown, X, Bug, LogOut, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SendTransaction } from '@/components/SendTransaction';
import { ReceiveTransaction } from '@/components/ReceiveTransaction';
import { TransactionHistory } from '@/components/TransactionHistory';
import * as XLSX from 'xlsx';
import WalletInfo from '@/components/WalletInfo';

// Enhanced Sidebar Link with active state support
const EnhancedSidebarLink = ({ link, isCollapsed }: { link: any; isCollapsed: boolean }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (link.onClick) {
      link.onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center w-full rounded-lg text-left
        relative overflow-hidden transition-all duration-200
        ${isCollapsed ? 'gap-0 px-2 py-3 justify-center' : 'gap-5 px-6 py-4'}
        ${link.isActive
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
        }
        ${link.isAction ? 'border border-dashed border-border/50' : ''}
      `}
      title={isCollapsed ? link.label : undefined}
    >
      {/* Active indicator */}
      {link.isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
      )}

      {/* Background hover effect */}
      <div className="absolute inset-0 bg-muted/20 rounded-lg opacity-0 hover:opacity-100" />

      {/* Icon */}
      <div className={`relative z-10 flex items-center justify-center ${
        link.isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}>
        {link.icon}
      </div>

      {/* Label - hidden when collapsed */}
      {!isCollapsed && (
        <>
          <span className="relative z-10 text-base font-medium flex-1">
            {link.label}
          </span>

          {/* Keyboard shortcut hint */}
          {link.shortcut && (
            <span className="relative z-10 text-xl text-muted-foreground/80 font-mono">
              {link.shortcut}
            </span>
          )}

          {/* Action indicator */}
          {link.isAction && (
            <div className="relative z-10">
              <Plus className="h-3 w-3 text-muted-foreground/50" />
            </div>
          )}
        </>
      )}
    </button>
  );
};const SimpleDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [activeSection, setActiveSection] = useState('wallet');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Persist sidebar state in localStorage, default to true on desktop, false on mobile
    if (typeof window === 'undefined') return true; // SSR fallback
    const savedState = localStorage.getItem('sidebar-open');
    if (savedState !== null) return JSON.parse(savedState);
    return window.innerWidth >= 1024; // lg breakpoint
  });
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const [showReceiveQR, setShowReceiveQR] = useState(false);
  // Built-in wallet - always connected
  const [isConnected, setIsConnected] = useState(true);
  const [address, setAddress] = useState('0x742d35Cc6663C0532d8c5E9C4267B53A0D7C9b1F');
  const [balance, setBalance] = useState('12.5623 APT');

  // Single wallet dashboard for all users

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            setSidebarOpen(prev => !prev);
            break;
          case '1':
            event.preventDefault();
            setActiveSection('wallet');
            break;
          case '2':
            event.preventDefault();
            setActiveSection('transactions');
            break;
          case '3':
            event.preventDefault();
            setActiveSection('portfolio');
            break;
          case '4':
            event.preventDefault();
            setActiveSection('security');
            break;
          case '5':
            event.preventDefault();
            setActiveSection('settings');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Built-in wallet initialization
  useEffect(() => {
    // Initialize wallet with default values
    setIsConnected(true);
    setAddress('0x742d35Cc6663C0532d8c5E9C4267B53A0D7C9b1F');
    setBalance('12.5623 APT');
  }, []);

  useEffect(() => {
    // Refresh balance periodically if connected
    if (isConnected) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Built-in wallet - no need for connection functions

  const handleLogout = async () => {
    try {
      // Built-in wallet stays connected, just sign out user
      // Then sign out from authentication
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still attempt to sign out even if wallet disconnect fails
      await signOut();
    }
  };

  const refreshBalance = () => {
    if (isConnected) {
      // Mock balance refresh
      const newBalance = (parseFloat(balance) + Math.random() * 0.01).toFixed(8);
      setBalance(newBalance + ' APT');
    }
  };

  // Add QR code generation for the wallet address
  const generateAddressQR = () => {
    setShowReceiveQR(true);
  };

  // Mock QR code component
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
            <img src="/logo.png" alt="Aptex Wallet Logo" className="h-6 w-6 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );



  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Auto-close sidebar on mobile after selection
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const getPageDescription = (section: string) => {
    const descriptions = {
      wallet: 'Manage your digital assets and wallet settings',
      transactions: 'View and track your transaction history',
      portfolio: 'Monitor your investment performance',
      security: 'Configure security settings and preferences',
      overview: 'Dashboard overview and analytics'
    };
    return descriptions[section as keyof typeof descriptions] || 'Dashboard';
  };

  const sidebarLinks = [
    {
      label: "Wallet",
      href: "#wallet",
      icon: <Wallet className="h-7 w-7 flex-shrink-0" />,
      onClick: () => handleSectionChange('wallet'),
      isActive: activeSection === 'wallet',
      shortcut: '⌘1'
    },
    {
      label: "Send",
      href: "#send",
      icon: <Send className="h-7 w-7 flex-shrink-0" />,
      onClick: () => setShowSendTransaction(true),
      isActive: false,
      isAction: true
    },
    {
      label: "Transactions",
      href: "#transactions",
      icon: <History className="h-7 w-7 flex-shrink-0" />,
      onClick: () => handleSectionChange('transactions'),
      isActive: activeSection === 'transactions',
      shortcut: '⌘2'
    },
    {
      label: "Portfolio",
      href: "#portfolio",
      icon: <BarChart3 className="h-7 w-7 flex-shrink-0" />,
      onClick: () => handleSectionChange('portfolio'),
      isActive: activeSection === 'portfolio',
      shortcut: '⌘3'
    },
    {
      label: "Security",
      href: "#security",
      icon: <Shield className="h-7 w-7 flex-shrink-0" />,
      onClick: () => handleSectionChange('security'),
      isActive: activeSection === 'security',
      shortcut: '⌘4'
    }
  ];

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cosmic-grid opacity-20"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full">
        <div className="w-full h-full opacity-5 bg-primary blur-[150px]"></div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-6 bg-card/50 backdrop-blur-md border-r border-border/50 lg:relative fixed z-50">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ultra-minimal-scrollbar">
            {/* Logo and Brand */}
            <motion.div
              className={`flex items-center mb-6 px-1 ${
                sidebarOpen ? 'gap-3' : 'justify-center gap-0'
              }`}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="h-10 w-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <img src="/logo.png" alt="Aptex Wallet Logo" className="h-5 w-5 object-contain" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-foreground tracking-tight">Aptex wallet</span>
                  <span className="text-xs text-muted-foreground/70">Wallet</span>
                </div>
              )}
            </motion.div>

            {/* Quick Stats */}
            {isConnected && (
              <motion.div
                className={`mb-4 p-3 bg-card/30 rounded-lg border border-border/30 ${
                  !sidebarOpen ? 'hidden' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: sidebarOpen ? 1 : 0, y: sidebarOpen ? 0 : 20 }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-xs text-muted-foreground mb-1">Balance</div>
                <div className="text-lg font-bold text-foreground">{balance}</div>
                <div className="text-xs text-green-400">+2.3% today</div>
              </motion.div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <EnhancedSidebarLink key={idx} link={link} isCollapsed={!sidebarOpen} />
              ))}
            </div>
          </div>
          
          {/* Sidebar Footer */}
          <div className="pt-6 space-y-4">
            {isConnected ? (
              <motion.div
                className={`space-y-4 ${!sidebarOpen ? 'hidden' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: sidebarOpen ? 1 : 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Current Wallet Display */}
                <div className="p-3 bg-card/20 rounded-lg border border-border/30">
                  <div className="text-xs text-muted-foreground mb-2">Current Account</div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Main Wallet</div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400">Connected</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-mono flex-1 text-foreground">
                      {address && formatAddress(address)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateAddressQR}
                        className="h-7 w-7 p-1 hover:bg-muted/50"
                        title="Show QR Code"
                      >
                        <QrCode className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(address || '')}
                        className="h-7 w-7 p-1 hover:bg-muted/50"
                        title="Copy Address"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Account Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSection('security')}
                    className="w-full border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSection('settings')}
                    className="w-full border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className={`space-y-4 ${!sidebarOpen ? 'hidden' : ''}`}>
                {/* Current Wallet Display */}
                <div className="p-3 bg-card/20 rounded-lg border border-border/30">
                  <div className="text-xs text-muted-foreground mb-2">Current Account</div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Main Wallet</div>
                      <div className="text-xs text-muted-foreground">Not connected</div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Action Button */}
                <div className="relative">
                  <Button
                    onClick={() => setShowSendTransaction(true)}
                    className="w-full bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
                    size="lg"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send APT
                  </Button>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-black/20 rounded-md blur-lg -z-10 opacity-75"></div>
                </div>
              </div>
            )}

            {/* Collapsed state: Show minimal connection status */}
            {!sidebarOpen && (
              <div className="flex flex-col items-center space-y-3">
                {isConnected ? (
                  <div className="flex flex-col items-center space-y-2">
                    {/* Connected wallet indicator */}
                    <div className="relative">
                      <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center" title={`Main Wallet - Connected\nBalance: ${balance}`}>
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse border-2 border-background"></div>
                    </div>
                    
                    {/* Quick actions */}
                    <div className="flex flex-col items-center space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateAddressQR}
                        className="h-7 w-7 p-1 hover:bg-muted/50 rounded-lg"
                        title="Show QR Code"
                      >
                        <QrCode className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveSection('settings')}
                        className="h-7 w-7 p-1 hover:bg-muted/50 rounded-lg"
                        title="Settings"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    {/* Current wallet indicator when collapsed */}
                    <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center" title="Main Wallet - Not connected">
                      <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <Button
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveSection('settings')}
                      className="h-8 w-8 p-1 hover:bg-muted/50 rounded-lg"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* User Actions */}
            <div className="pt-4 border-t border-border/30 space-y-3">
              {sidebarOpen && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                  <span>Press ⌘B to toggle sidebar</span>
                </div>
              )}
              <Button
                variant="ghost"
                size={sidebarOpen ? "sm" : "sm"}
                onClick={handleLogout}
                className={`${
                  sidebarOpen 
                    ? 'w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start' 
                    : 'h-8 w-8 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 mx-auto'
                }`}
                title="Logout"
              >
                <LogOut className={`h-4 w-4 ${sidebarOpen ? 'mr-2' : ''}`} />
                {sidebarOpen && 'Logout'}
              </Button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 overflow-auto relative z-10">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-muted/50 cosmic-glow"
                title={`${sidebarOpen ? 'Close' : 'Open'} sidebar (⌘B)`}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-foreground">
                  {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getPageDescription(activeSection)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <Button
                    variant="outline"
                    onClick={refreshBalance}
                    className="flex items-center gap-2 border-border hover:bg-muted/50 cosmic-glow"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateAddressQR}
                    className="flex items-center gap-2 border-border hover:bg-muted/50 cosmic-glow"
                  >
                    <QrCode className="h-4 w-4" />
                    Receive
                  </Button>
                </>
              )}
              
              {/* User Menu */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Wallet Section */}
          {activeSection === 'wallet' && (
            <div className="space-y-6">
              {/* Enhanced Wallet Information */}
              {isConnected && address && (
                <WalletInfo
                  address={address}
                  balance={balance}
                  network="mainnet"
                  isConnected={isConnected}
                  onRefresh={refreshBalance}
                />
              )}

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
                      onClick={() => setShowBalance(!showBalance)}
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
                        {showBalance ? (balance ? `${parseFloat(balance).toFixed(8)} APT` : '0.00000000 APT') : '••••••••'}
                      </div>
                      <div className="text-muted-foreground">
                        {showBalance ? (balance ? `≈ ₹${(parseFloat(balance) * 251100).toFixed(2)}` : '≈ ₹0.00') : '••••••'}
                      </div>
                    </div>
                    
                    {address && (
                      <div className="bg-muted/20 backdrop-blur-sm rounded-lg p-4 space-y-2 border border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Address</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(address)}
                            className="h-6 w-6 p-0 hover:bg-muted/50"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="font-mono text-sm text-muted-foreground break-all">{address}</div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cosmic-glow" 
                        onClick={() => setShowSendTransaction(true)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-border hover:bg-muted/50 cosmic-glow" 
                        onClick={generateAddressQR}
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
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 cosmic-glow bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30" onClick={() => setShowSendTransaction(true)}>
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <Send className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="font-medium text-foreground">Send APT</div>
                      <div className="text-sm text-muted-foreground">Transfer to others</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 cosmic-glow bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30" onClick={generateAddressQR}>
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <QrCode className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="font-medium text-foreground">Receive</div>
                      <div className="text-sm text-muted-foreground">Show QR code</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 cosmic-glow bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30" onClick={() => setActiveSection('transactions')}>
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
                      onClick={() => setActiveSection('transactions')}
                      className="border-border hover:bg-muted/50 cosmic-glow"
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Recent Transactions</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect your wallet to view transaction history
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveSection('transactions')}
                      className="border-border hover:bg-muted/50"
                    >
                      View Transaction History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions Section */}
          {activeSection === 'transactions' && (
            <TransactionHistory />
          )}

          {/* Portfolio Section */}
          {activeSection === 'portfolio' && (
            <div className="space-y-6">
              <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BarChart3 className="h-5 w-5" />
                    Portfolio Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Portfolio Coming Soon</h3>
                    <p className="text-muted-foreground">Track your crypto portfolio performance and analytics.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cosmic-glow">
                      <div>
                        <div className="font-medium text-foreground">Two-Factor Authentication</div>
                        <div className="text-sm text-muted-foreground">Secure your account with 2FA</div>
                      </div>
                      <Button variant="outline" size="sm" className="border-border hover:bg-muted/50 cosmic-glow">
                        Enable
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cosmic-glow">
                      <div>
                        <div className="font-medium text-foreground">Backup Recovery Phrase</div>
                        <div className="text-sm text-muted-foreground">Safely store your recovery phrase</div>
                      </div>
                      <Button variant="outline" size="sm" className="border-border hover:bg-muted/50 cosmic-glow">
                        Backup
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cosmic-glow">
                      <div>
                        <div className="font-medium text-foreground">Change Password</div>
                        <div className="text-sm text-muted-foreground">Update your wallet password</div>
                      </div>
                      <Button variant="outline" size="sm" className="border-border hover:bg-muted/50 cosmic-glow">
                        Change
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}


        </div>
      </div>

      {/* Receive Transaction Modal */}
      <ReceiveTransaction 
        isOpen={showReceiveQR}
        onClose={() => setShowReceiveQR(false)}
        address={address || ''}
      />

      {/* Modals */}
      
      <SendTransaction
        isOpen={showSendTransaction}
        onClose={() => setShowSendTransaction(false)}
      />
    </div>
  );
};

export default SimpleDashboard;