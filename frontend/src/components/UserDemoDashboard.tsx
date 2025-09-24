import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Wallet, 
  Send, 
  QrCode, 
  History, 
  Shield, 
  Settings,
  Download,
  CheckCircle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Menu,
  RefreshCw,
  Zap,
  TrendingUp,
  ArrowUpDown,
  LayoutDashboard
} from 'lucide-react';

const UserDemoDashboard = () => {
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

  // Demo data matching real user dashboard
  const demoTransactions = [
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

  const sidebarLinks = [
    { label: 'My Wallet', icon: Wallet, active: true },
    { label: 'Scan & Pay', icon: Send, active: false },
    { label: 'Payment History', icon: History, active: false },
    { label: 'Security', icon: Shield, active: false },
    { label: 'Settings', icon: Settings, active: false }
  ];

  const balanceHistory = [
    { date: 'Mon', eth: 3.12, inr: 693600 },
    { date: 'Tue', eth: 3.18, inr: 706920 },
    { date: 'Wed', eth: 3.25, inr: 722500 },
    { date: 'Thu', eth: 3.28, inr: 729360 },
    { date: 'Today', eth: 3.28, inr: 729360 }
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
            Personal Crypto Wallet
            <Wallet className="h-2.5 w-2.5 text-primary" />
          </span>
        </div>
        
        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-balance text-foreground">
          CrypPal User Dashboard
        </h1>
        
        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
          Manage your digital assets with complete control. Send, receive, and track your crypto transactions with ease.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 items-center">
          {user ? (
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground text-base h-12 px-8 transition-all duration-200 min-h-[48px]"
              onClick={() => navigate('/user-dashboard')}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground text-base h-12 px-8 transition-all duration-200 min-h-[48px]">
                <Wallet className="h-4 w-4 mr-2" />
                Create Wallet
              </Button>
              <Button variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-base h-12 px-8 transition-all duration-200 min-h-[48px]">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </Button>
            </>
          )}
        </div>
        
        {/* Trust Indicator */}
        <div className="pt-6 text-sm text-muted-foreground">
          Non-custodial • Your keys, your crypto • Secure by design
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
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground font-medium">CrypPal Wallet Dashboard</span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* ETH Balance Display */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted text-foreground text-sm">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span>{showBalance ? '3.28 ETH' : '••••••'}</span>
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
                  Scan
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
                {sidebarOpen && <span className="text-xs text-muted-foreground uppercase">Wallet Features</span>}
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
                      <Send className="h-3 w-3 text-blue-600" />
                      <span className="text-sm">Send ETH</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted/50 cursor-pointer">
                      <Download className="h-3 w-3 text-green-600" />
                      <span className="text-sm">Receive</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted/50 cursor-pointer">
                      <TrendingUp className="h-3 w-3 text-purple-600" />
                      <span className="text-sm">Portfolio</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Main Content */}
            <div className="flex-1 p-4 bg-background overflow-hidden">
              {/* Balance Card */}
              <Card className="p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Balance</p>
                    <p className="text-2xl font-bold text-foreground">
                      {showBalance ? '3.28 ETH' : '••••••'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {showBalance ? '≈ ₹7,29,360' : '••••••'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 px-3">
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-3">
                      <Download className="h-3 w-3 mr-1" />
                      Receive
                    </Button>
                  </div>
                </div>
                
                {/* Portfolio Chart Placeholder */}
                <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Balance History Chart</p>
                  </div>
                </div>
              </Card>
              
              {/* Payment History */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">Payment History</h3>
                  <Badge variant="secondary" className="text-xs">{demoTransactions.length}</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 px-3 text-sm">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                  <Button size="sm" className="h-8 px-3 text-sm">
                    <QrCode className="h-3 w-3 mr-1" />
                    Scan QR
                  </Button>
                </div>
              </div>
              
              {/* Transaction List */}
              <div className="space-y-3">
                {demoTransactions.map((transaction) => (
                  <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-sm">{transaction.icon}</span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">-{transaction.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.fiatAmount} • {transaction.merchant} • {transaction.time}
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
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Your Wallet</h3>
                <p className="text-sm text-muted-foreground">Complete control</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Non-custodial wallet where you own your private keys. Your crypto, your control, always.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">QR Payments</h3>
                <p className="text-sm text-muted-foreground">Scan and pay</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Scan merchant QR codes to pay instantly. Fast, secure, and hassle-free transactions.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground">Military-grade</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Advanced encryption and security features keep your digital assets safe and secure.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default UserDemoDashboard;
