import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Send, 
  History, 
  BarChart3, 
  Shield,
  Menu,
  Copy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { SendTransaction } from '@/components/SendTransaction';
import { TransactionHistory } from '@/components/TransactionHistory';
import { 
  StoredWallet, 
  WalletAccount,
  Transaction,
  getStoredWallet,
  getCurrentAccount,
  getAccountCount,
  createNewWallet,
  addNewAccount,
  switchAccount,
  clearWalletData,
  getAccountBalance,
  getAccountTransactions,
  fundAccount,
} from '@/utils/walletUtils';

// Import all the new components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LoadingState } from '@/components/dashboard/LoadingState';
import { CreateWalletSection } from '@/components/dashboard/CreateWalletSection';
import { WalletSection } from '@/components/dashboard/WalletSection';
import { PortfolioSection } from '@/components/dashboard/PortfolioSection';
import { SecuritySection } from '@/components/dashboard/SecuritySection';
import { EnhancedSidebarLink, type SidebarLinkProps } from '@/components/dashboard/EnhancedSidebarLink';
import { AddressQRCode } from '@/components/dashboard/AddressQRCode';
import { SidebarFooter } from '@/components/dashboard/SidebarFooter';
import { SidebarHeader } from '@/components/dashboard/SidebarHeader';

const SimpleDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [activeSection, setActiveSection] = useState('wallet');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const savedState = localStorage.getItem('sidebar-open');
    if (savedState !== null) return JSON.parse(savedState);
    return window.innerWidth >= 1024;
  });
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const [showReceiveQR, setShowReceiveQR] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);

  // Real wallet state
  const [wallet, setWallet] = useState<StoredWallet | null>(null);
  const [currentAccount, setCurrentAccount] = useState<WalletAccount | null>(null);
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [addWalletLoading, setAddWalletLoading] = useState(false);
  const [accountList, setAccountList] = useState<WalletAccount[]>([]);

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

  const loadWalletData = async (account: WalletAccount) => {
    try {
      const accountBalance = await getAccountBalance(account.address);
      setBalance(accountBalance);

      const accountTransactions = await getAccountTransactions(account.address, 10);
      // Map transactions to our Transaction type
      const mappedTransactions: Transaction[] = accountTransactions.map((tx: any) => ({
        version: tx.version || 'N/A',
        timestamp: tx.timestamp || Date.now().toString(),
        type: tx.type || 'transaction',
        success: tx.success !== false,
        hash: tx.hash
      }));
      setTransactions(mappedTransactions);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const initializeWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedWallet = getStoredWallet();
      const accountCount = getAccountCount();

      if (accountCount === 0 || !storedWallet) {
        setWallet(null);
        setCurrentAccount(null);
        setShowCreateWallet(true);
      } else {
        setWallet(storedWallet);
        const account = getCurrentAccount();
        setCurrentAccount(account);
        if (account) {
          await loadWalletData(account);
        }
      }
    } catch (error) {
      console.error('Error initializing wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshWalletData = useCallback(async () => {
    if (currentAccount) {
      await loadWalletData(currentAccount);
    }
  }, [currentAccount]);

  useEffect(() => {
    initializeWallet();
  }, [initializeWallet]);

  useEffect(() => {
    if (wallet) {
      setAccountList(wallet.accounts);
    } else {
      setAccountList([]);
    }
  }, [wallet]);

  useEffect(() => {
    if (currentAccount) {
      const interval = setInterval(() => {
        refreshWalletData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentAccount, refreshWalletData]);

  const waitForBalance = async (account: WalletAccount) => {
    let attempts = 0;
    while (attempts < 15) {
      try {
        const newBalance = await getAccountBalance(account.address);
        if (parseFloat(newBalance) > 0) {
          return;
        }
      } catch (error) {
        console.error("Error while polling for balance:", error);
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.warn("Timed out waiting for balance to update after funding.");
  };

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const newWallet = createNewWallet();
      setWallet(newWallet);
      const account = getCurrentAccount();
      setCurrentAccount(account);
      setShowCreateWallet(false);
      if (account) {
        await fundAccount(account.address);
        await waitForBalance(account);
        await loadWalletData(account);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWallet = async () => {
    setAddWalletLoading(true);
    try {
      const newAccount = addNewAccount();
      if (newAccount) {
        const updatedWallet = getStoredWallet();
        setWallet(updatedWallet);
        setCurrentAccount(newAccount);
        await fundAccount(newAccount.address);
        await waitForBalance(newAccount);
        await loadWalletData(newAccount);
      }
    } catch (error) {
      console.error('Error adding new account:', error);
    } finally {
      setAddWalletLoading(false);
    }
  };

  const handleSwitchAccount = async (accountIndex: number) => {
    if (switchAccount(accountIndex)) {
      const newAccount = getStoredWallet()?.accounts[accountIndex];
      if (newAccount) {
        setIsLoading(true);
        setCurrentAccount(newAccount);
        await loadWalletData(newAccount);
        setIsLoading(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleLogout = async () => {
    try {
      clearWalletData();
      setWallet(null);
      setCurrentAccount(null);
      setBalance('0');
      setTransactions([]);
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
      await signOut();
    }
  };

  const refreshBalance = async () => {
    if (currentAccount) {
      await refreshWalletData();
    }
  };

  const generateAddressQR = () => {
    setShowReceiveQR(true);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const sidebarLinks: SidebarLinkProps[] = [
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

  if (isLoading) {
    return <LoadingState />;
  }

  if (showCreateWallet) {
    return (
      <CreateWalletSection
        isLoading={isLoading}
        onCreateWallet={handleCreateWallet}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? "280px" : "0px",
          opacity: sidebarOpen ? 1 : 0,
        }}
        transition={{ 
          duration: 0.3, 
          ease: "easeInOut",
          opacity: { duration: sidebarOpen ? 0.3 : 0.1 }
        }}
        className="relative border-r border-border bg-background flex-shrink-0 z-10"
        style={{ 
          overflow: 'hidden',
          minWidth: sidebarOpen ? "280px" : "0px"
        }}
      >
        <div className="flex flex-col h-full p-3">
          <SidebarHeader
            sidebarOpen={sidebarOpen}
            currentAccount={currentAccount}
          />

          {/* Navigation Links */}
          <motion.nav
            animate={{ opacity: sidebarOpen ? 1 : 0 }}
            transition={{ duration: 0.2, delay: sidebarOpen ? 0.2 : 0 }}
            className="flex-1 space-y-1"
          >
            {sidebarLinks.map((link, index) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -20 }}
                transition={{ 
                  duration: 0.2, 
                  delay: sidebarOpen ? 0.25 + (index * 0.05) : 0 
                }}
              >
                <EnhancedSidebarLink 
                  link={link}
                  isCollapsed={!sidebarOpen}
                />
              </motion.div>
            ))}
          </motion.nav>

          <SidebarFooter
            currentAccount={currentAccount}
            accountList={accountList}
            balance={balance}
            sidebarOpen={sidebarOpen}
            onSwitchAccount={handleSwitchAccount}
            onShowReceiveQR={generateAddressQR}
            onCopyAddress={copyToClipboard}
            onSetActiveSection={handleSectionChange}
            onLogout={handleLogout}
          />
        </div>
      </motion.div>

      {/* Toggle Button */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-4 z-50"
          >
            <Button
              onClick={() => setSidebarOpen(true)}
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 bg-background border shadow-lg hover:shadow-xl transition-shadow"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          activeSection={activeSection}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentAccount={currentAccount}
          user={user}
          onRefreshBalance={refreshBalance}
          onShowReceiveQR={generateAddressQR}
          onAddWallet={handleAddWallet}
          onLogout={handleLogout}
          addWalletLoading={addWalletLoading}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {activeSection === 'wallet' && (
                <WalletSection
                  balance={balance}
                  showBalance={showBalance}
                  currentAccount={currentAccount}
                  transactions={transactions}
                  onToggleBalance={() => setShowBalance(!showBalance)}
                  onSendTransaction={() => setShowSendTransaction(true)}
                  onShowReceiveQR={generateAddressQR}
                  onViewTransactions={() => handleSectionChange('transactions')}
                  onCopyAddress={copyToClipboard}
                />
              )}

              {activeSection === 'transactions' && (
                <TransactionHistory />
              )}

              {activeSection === 'portfolio' && (
                <PortfolioSection />
              )}

              {activeSection === 'security' && (
                <SecuritySection />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Dialogs and Modals */}
      <AnimatePresence>
        {showSendTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSendTransaction(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <SendTransaction
                isOpen={showSendTransaction}
                onClose={() => setShowSendTransaction(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {showReceiveQR && currentAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReceiveQR(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center space-y-4">
                <h3 className="text-lg font-semibold">Receive APT</h3>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={currentAccount.address}
                    size={200}
                    className="mx-auto"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Your Address</p>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm font-mono">
                    <span className="flex-1 truncate">{currentAccount.address}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(currentAccount.address)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowReceiveQR(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimpleDashboard;