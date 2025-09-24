import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Wallet, 
  Zap, 
  Shield, 
  QrCode, 
  TrendingUp, 
  Users, 
  CreditCard, 
  BarChart3,
  Settings,
  Download,
  Share2,
  CheckCircle,
  Clock,
  AlertCircle,
  Menu,
  Store,
  Receipt,
  RefreshCw,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  LayoutDashboard
} from 'lucide-react';

const MerchantDemoDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Demo data matching real dashboard
  const demoTransactions = [
    {
      id: 1,
      customer: 'Coffee House Customer',
      amount: '0.002 ETH',
      fiatAmount: '₹500',
      time: '5 mins ago',
      status: 'Confirmed',
      type: 'payment',
      icon: '☕'
    },
    {
      id: 2,
      customer: 'Online Store Purchase',
      amount: '0.015 ETH',
      fiatAmount: '₹3,750',
      time: '2 hours ago',
      status: 'Confirmed',
      type: 'payment',
      icon: '🛍️'
    },
    {
      id: 3,
      customer: 'Food Truck Order',
      amount: '0.008 ETH',
      fiatAmount: '₹2,000',
      time: 'Yesterday',
      status: 'Confirmed',
      type: 'payment',
      icon: '🍔'
    }
  ];

  const sidebarLinks = [
    { label: 'Overview', icon: BarChart3, active: true },
    { label: 'Payments', icon: Receipt, active: false },
    { label: 'Customers', icon: Users, active: false },
    { label: 'QR Codes', icon: QrCode, active: false },
    { label: 'Analytics', icon: TrendingUp, active: false },
    { label: 'Settings', icon: Settings, active: false }
  ];

  return (
    <section className="relative w-full py-12 md:py-20 px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden bg-background mt-20 md:mt-28">
      {/* Background Effects */}
      <div className="absolute inset-0 cosmic-grid opacity-30"></div>
      
      {/* Gradient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full">
        <div className="w-full h-full opacity-10 bg-primary blur-[120px]"></div>
      </div>
      
      {/* Hero Content */}
      <div className={`relative z-10 max-w-4xl text-center space-y-6 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Status Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-muted text-white">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
            Web3 Payment Revolution
            <Zap className="h-2.5 w-2.5 text-primary" />
          </span>
        </div>
        
        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-balance text-foreground">
          CrypPal Merchant Dashboard
        </h1>
        
        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
          Accept Ethereum payments directly from customers with zero third-party fees. 
          Create wallets, generate QR codes, and receive crypto payments instantly.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 items-center">
          {user ? (
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground text-base h-12 px-8 transition-all duration-200 min-h-[48px]"
              onClick={() => navigate('/merchant-dashboard')}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground text-base h-12 px-8 transition-all duration-200 min-h-[48px]">
                <Wallet className="h-4 w-4 mr-2" />
                Create Merchant Wallet
              </Button>
              <Button variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-base h-12 px-8 transition-all duration-200 min-h-[48px]">
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            </>
          )}
        </div>
        
        {/* Trust Indicator */}
        <div className="pt-6 text-sm text-muted-foreground">
          Non-custodial • Ethereum mainnet • No setup fees
        </div>
      </div>

      {/* Interactive Dashboard Preview */}
      <div className={`w-full max-w-7xl mt-16 z-10 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <div className="cosmic-glow relative rounded-xl overflow-hidden border border-border backdrop-blur-sm bg-card shadow-lg">
          {/* Dashboard Header */}
          <div className="bg-card backdrop-blur-md w-full border-b border-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground font-medium">CrypPal Business Dashboard</span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* ETH Balance Display */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted text-foreground text-sm">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span>{showBalance ? '2.45 ETH' : '••••••'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-6 w-6 p-0"
                  >
                    {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                </div>
                
                <Button size="sm" className="h-8 px-3 text-sm">
                  <QrCode className="h-3 w-3 mr-1" />
                  Generate QR
                </Button>

                <Button size="sm" variant="outline" className="h-8 px-3 text-sm">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Dashboard Content Area */}
          <div className="flex h-[600px] overflow-hidden">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} border-r border-border p-4 space-y-4 bg-card transition-all duration-300`}>
              <div className="flex items-center justify-between mb-6">
                {sidebarOpen && <span className="text-xs text-muted-foreground uppercase">Business Tools</span>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="h-6 w-6 p-0"
                >
                  <Menu className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-1">
                {sidebarLinks.map((link, idx) => {
                  const IconComponent = link.icon;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        link.active 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      {sidebarOpen && <span className="text-sm">{link.label}</span>}
                    </div>
                  );
                })}
              </div>
              
              {sidebarOpen && (
                <div className="mt-8 space-y-3">
                  <div className="text-xs text-muted-foreground uppercase">Quick Actions</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted/50 cursor-pointer">
                      <QrCode className="h-3 w-3 text-green-600" />
                      <span className="text-sm">Generate QR</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted/50 cursor-pointer">
                      <Share2 className="h-3 w-3 text-blue-600" />
                      <span className="text-sm">Payment Link</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted/50 cursor-pointer">
                      <Download className="h-3 w-3 text-purple-600" />
                      <span className="text-sm">Export Data</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Main Content */}
            <div className="flex-1 p-4 bg-background overflow-hidden">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-lg font-bold text-foreground">2.45 ETH</p>
                      <p className="text-xs text-green-600">+12.5%</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Transactions</p>
                      <p className="text-lg font-bold text-foreground">156</p>
                      <p className="text-xs text-blue-600">+8 today</p>
                    </div>
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Customers</p>
                      <p className="text-lg font-bold text-foreground">89</p>
                      <p className="text-xs text-purple-600">+5 new</p>
                    </div>
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                      <p className="text-lg font-bold text-foreground">98.2%</p>
                      <p className="text-xs text-green-600">+0.5%</p>
                    </div>
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                </Card>
              </div>
              
              {/* Content Header */}
              <div className="flex items-center justify-between mb-6 min-w-0">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <h3 className="font-medium text-foreground">Recent Transactions</h3>
                  <Badge variant="secondary" className="text-xs">{demoTransactions.length}</Badge>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-8 px-3 text-sm">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button size="sm" className="h-8 px-3 text-sm">
                    <Zap className="h-3 w-3 mr-1" />
                    Request Payment
                  </Button>
                </div>
              </div>
              
              {/* Transaction List */}
              <div className="space-y-3">
                {demoTransactions.map((transaction) => (
                  <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm">{transaction.icon}</span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{transaction.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.fiatAmount} • {transaction.customer} • {transaction.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          {transaction.status}
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className={`w-full max-w-7xl mt-12 z-10 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Secure Payments</h3>
                <p className="text-sm text-muted-foreground">Non-custodial wallet</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Accept payments directly to your wallet with full control over your private keys and funds.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">QR Payments</h3>
                <p className="text-sm text-muted-foreground">Instant transactions</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Generate dynamic QR codes for customers to scan and pay with their CrypPal wallet instantly.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Analytics</h3>
                <p className="text-sm text-muted-foreground">Business insights</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Track your revenue, customer patterns, and payment trends with detailed analytics dashboard.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MerchantDemoDashboard;
