import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Send, ArrowDownLeft, ArrowUpRight, Eye, EyeOff, Copy, QrCode, Settings, Plus, TrendingUp, CreditCard } from 'lucide-react';

const MerchantHeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

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
            Your Personal Wallet
            <Wallet className="h-2.5 w-2.5 text-primary" />
          </span>
        </div>
        
        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-balance text-foreground">
          Your Crypto Wallet
        </h1>
        
        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
          Secure, simple, and powerful. Manage your Ethereum portfolio with complete control. 
          Non-custodial wallet with cutting-edge security and seamless DeFi integration.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 items-center">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground text-base h-12 px-8 transition-all duration-200 min-h-[48px]">
            Create Wallet
          </Button>
          <Button variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-base h-12 px-8 transition-all duration-200 min-h-[48px]">
            Connect Wallet
          </Button>
        </div>
        
        {/* Trust Indicator */}
        <div className="pt-6 text-sm text-muted-foreground flex items-center justify-center gap-4">
          <span>🔒 Self-Custody</span>
          <span>⚡ DeFi Ready</span>
          <span>🌍 Global Access</span>
        </div>
      </div>
      
      {/* Product Preview/Demo */}
      <div className={`w-full max-w-4xl mt-12 z-10 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <div className="relative rounded-xl overflow-hidden border border-border backdrop-blur-sm bg-card shadow-lg">
          {/* Wallet Header */}
          <div className="bg-card backdrop-blur-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">My Wallet</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    0x742d...9a8c
                    <Copy className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
            </div>
            
            {/* Balance Section */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Portfolio Balance</h3>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="text-3xl font-bold text-foreground">
                  {showBalance ? '2.47 ETH' : '•••••'}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg text-muted-foreground">
                    {showBalance ? '$6,175.00 USD' : '•••••••'}
                  </div>
                  <div className="flex items-center gap-1 text-green-500 text-sm">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12.3%</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  Send
                </button>
                <button className="flex-1 border border-border px-4 py-3 rounded-lg font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                  <ArrowDownLeft className="h-4 w-4" />
                  Receive
                </button>
                <button className="border border-border px-4 py-3 rounded-lg font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />
                  Buy
                </button>
              </div>
            </div>

            {/* Assets & Activity */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">Recent Activity</h4>
                <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                  12 transactions
                </span>
              </div>
              
              <div className="space-y-3">                {/* DeFi Yield Transaction */}
                <div 
                  className="flex items-center justify-between p-4 rounded-lg bg-card"
                  style={{ 
                    borderWidth: '1px',
                    borderStyle: 'solid', 
                    borderColor: 'hsl(0 0% 15%)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">DeFi Rewards</div>
                      <div className="text-sm text-muted-foreground">Uniswap V3 LP • 5 mins ago</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">+0.024 ETH</div>
                    <div className="text-xs text-muted-foreground">+$60.12</div>
                  </div>
                </div>

                {/* Received Transaction */}
                <div 
                  className="flex items-center justify-between p-4 rounded-lg bg-card"
                  style={{ 
                    borderWidth: '1px',
                    borderStyle: 'solid', 
                    borderColor: 'hsl(0 0% 15%)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Received</div>
                      <div className="text-sm text-muted-foreground">From: 0x1234...5678 • 15 mins ago</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">+0.15 ETH</div>
                    <div className="text-xs text-muted-foreground">+$375.50</div>
                  </div>
                </div>                {/* Sent Transaction */}
                <div 
                  className="flex items-center justify-between p-4 rounded-lg bg-card"
                  style={{ 
                    borderWidth: '1px',
                    borderStyle: 'solid', 
                    borderColor: 'hsl(0 0% 15%)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Sent</div>
                      <div className="text-sm text-muted-foreground">To: ENS: alice.eth • 1 hour ago</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">-0.08 ETH</div>
                    <div className="text-xs text-muted-foreground">-$200.24</div>
                  </div>
                </div>                {/* Pending Transaction */}
                <div 
                  className="flex items-center justify-between p-4 rounded-lg bg-card"
                  style={{ 
                    borderWidth: '1px',
                    borderStyle: 'solid', 
                    borderColor: 'hsl(0 0% 15%)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Swapping</div>
                      <div className="text-sm text-muted-foreground">ETH → USDC • 2 hours ago</div>
                    </div>
                  </div>                  <div className="text-right">
                    <div className="text-sm font-medium text-yellow-600">-0.25 ETH</div>
                    <div className="flex items-center justify-end gap-1 text-xs text-yellow-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                      Pending
                    </div>
                  </div>
                </div>                {/* Staking Reward */}
                <div 
                  className="flex items-center justify-between p-4 rounded-lg bg-card"
                  style={{ 
                    borderWidth: '1px',
                    borderStyle: 'solid', 
                    borderColor: 'hsl(0 0% 15%)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Staking Reward</div>
                      <div className="text-sm text-muted-foreground">Ethereum 2.0 • 6 hours ago</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">+0.003 ETH</div>
                    <div className="text-xs text-muted-foreground">+$7.50</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MerchantHeroSection;
