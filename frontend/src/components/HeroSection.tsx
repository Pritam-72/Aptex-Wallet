import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, Users, Zap, Shield, Wallet, X } from 'lucide-react';
import { PinContainer } from '@/components/ui/3d-pin';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Custom hook for viewport detection
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showRedirectNotice, setShowRedirectNotice] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Initialize UnicornStudio with exact implementation from their docs
  useEffect(() => {
    // Exact implementation from UnicornStudio docs
    if (!(window as any).UnicornStudio) {
      (window as any).UnicornStudio = { isInitialized: false };
      
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.31/dist/unicornStudio.umd.js";
      
      script.onload = function() {
        if (!(window as any).UnicornStudio.isInitialized) {
          (window as any).UnicornStudio.init();
          (window as any).UnicornStudio.isInitialized = true;
          console.log('UnicornStudio loaded and initialized');
        }
      };
      
      (document.head || document.body).appendChild(script);
    } else if (!(window as any).UnicornStudio.isInitialized) {
      // If UnicornStudio exists but not initialized
      try {
        (window as any).UnicornStudio.init();
        (window as any).UnicornStudio.isInitialized = true;
        console.log('UnicornStudio re-initialized');
      } catch (error) {
        console.error('Error initializing UnicornStudio:', error);
      }
    }
  }, []);

  // Show redirect notice for logged-in users after 3 seconds
  useEffect(() => {
    if (user) {
      const redirectTimer = setTimeout(() => {
        setShowRedirectNotice(true);
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, [user]);

  // Get user's dashboard route
  const getDashboardRoute = () => {
    return '/dashboard';
  };

  return (
    <section className="relative w-full pt-4 sm:pt-8 md:pt-12 pb-16 sm:pb-24 md:pb-32 px-10 flex flex-col items-center justify-center overflow-hidden bg-background mt-14 sm:mt-17 md:mt-21">
      {/* Rounded Container with Black Background */}
      <div className="relative w-full max-w-full bg-black rounded-3xl overflow-hidden">
        {/* UnicornStudio 3D Background */}
        <div 
          className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          style={{ 
            opacity: 0.8,
            pointerEvents: 'none'
          }}
        >
          <div 
            data-us-project="hXMrWxpuGilKPHMEOelf" 
            style={{
              width: '1920px', 
              height: '1080px',
              transform: 'scale(1)',
              transformOrigin: 'center center'
            }}
          />
        </div>
        
        {/* Subtle background effects for layering */}
        <div className="absolute inset-0 cosmic-grid opacity-5 z-10"></div>
        
        {/* Container Content */}
        <div className="relative z-20 px-4 sm:px-6 md:px-12 py-16 sm:py-24 md:py-32 flex flex-col items-center justify-center">
          {/* Redirect Notice for Logged-in Users */}
          {showRedirectNotice && user && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm mx-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Welcome back!</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRedirectNotice(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Would you like to go to your dashboard?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate(getDashboardRoute())}
                  className="flex-1"
                >
                  <Wallet className="h-3 w-3 mr-1" />
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRedirectNotice(false)}
                >
                  Stay Here
                </Button>
              </div>
            </div>
          )}
          
          {/* Hero Content */}
          <div className={`relative z-20 max-w-5xl text-center space-y-6 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Status Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-muted text-white">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="hidden sm:inline">Smart Wallet with EMI & NFT Integration</span>
            <span className="sm:hidden">Smart Wallet Innovation</span>
            <Zap className="h-2.5 w-2.5 text-primary" />
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-white leading-none">
          <span className="text-cyan-200">Aptos Wallet</span>
          <span className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl block mt-1 sm:mt-2 text-white">
            <span className="block sm:inline">EMI, NFT &</span>
            <span className="block sm:inline sm:ml-2">INR Integration</span>
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-base sm:text-lg md:text-xl text-white max-w-2xl sm:max-w-3xl mx-auto text-balance leading-relaxed px-2 sm:px-0">
          We're building a smart wallet on Aptos that makes money move like messages. 
          <span className="hidden sm:inline"> With UPI-crypto bridging, EMI options, and NFT-backed loyalty, it's the first wallet to blend DeFi + RWA + Indian payments in one place.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 items-center">
          {user ? (
            // Show dashboard button for logged-in users
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-medium h-11 px-7 flex items-center justify-center space-x-1.5"
              onClick={() => navigate(getDashboardRoute())}
            >
              <Wallet className="h-4 w-4 mr-1" />
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-medium h-11 px-7 flex items-center justify-center mr-2"
                onClick={() => window.location.href = '/auth'}
              >
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="bg-black border-gray-700 text-white hover:bg-gray-900 rounded-full text-sm font-medium h-11 px-7 flex items-center justify-center"
                onClick={() => window.location.href = '/about'}
              >
                Learn More
              </Button>
            </>
          )}
        </div>

        {/* Trust Indicator */}
        <div className="pt-6 text-xs sm:text-sm text-white/80 text-center">
          <span className="block sm:inline">Built on Aptos blockchain</span>
          <span className="hidden sm:inline"> • </span>
          <span className="block sm:inline">Smart contract security</span>
          <span className="hidden sm:inline"> • </span>
            <span className="block sm:inline">UPI integration ready</span>
          </div>
          </div>

          {/* Feature Cards */}
          <div className={`w-full max-w-7xl mt-12 sm:mt-16 md:mt-20 z-20 relative transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 justify-center items-center px-2 sm:px-4">
          {isDesktop ? (
            <>
              {/* Individual Solutions Card (3D) */}
              <PinContainer title="Pay Using Crypto" href="/user">
                <div className="flex flex-col p-6 sm:p-8 tracking-tight text-slate-100/50 w-full max-w-[22rem] sm:w-[24rem] h-auto min-h-[24rem] sm:h-[26rem] bg-gradient-to-b from-slate-800/50 to-slate-800/0 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
                  {/* Header */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-slate-700/40 flex items-center justify-center">
                      <Users className="h-6 w-6 sm:h-7 sm:w-7 text-slate-300" />
                    </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">For Individuals</h3>
                    <p className="text-sm text-slate-400">EMI, NFT & INR Integration</p>
                  </div>
                </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-200">EMI</div>
                      <div className="text-xs text-slate-400 leading-relaxed">Crypto Payments</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-200">INR</div>
                      <div className="text-xs text-slate-400 leading-relaxed">Live Conversion</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 sm:space-y-4 flex-1">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">Monthly EMI in APT tokens</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">NFT collectibles & rewards</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">UPI-APT bridging</span>
                    </div>
                  </div>                  {/* Status Indicator */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-green-500 animate-pulse" />
                      <div className="text-xs text-slate-400">Ready to Spend</div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4 py-2 transition-all duration-200 min-h-[36px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = '/user';
                      }}
                    >
                      Get Started
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </PinContainer>

            </>
          ) : (
            <>
              {/* Minimal Individual Card */}
              <div className="w-full max-w-xs bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl p-5 flex flex-col items-start gap-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">For Individuals</h3>
                    <p className="text-xs text-white/70">EMI, NFT & INR Integration</p>
                  </div>
                </div>
                <div className="text-sm text-white font-medium">Buy with EMI in APT tokens, collect NFTs, see INR values.</div>
                {/* Feature List */}
                <ul className="mt-2 space-y-2 w-full">
                  <li className="flex items-center gap-2 text-xs text-white/80"><Shield className="h-4 w-4" /> Monthly EMI in APT tokens</li>
                  <li className="flex items-center gap-2 text-xs text-white/80"><Zap className="h-4 w-4" /> NFT collectibles & rewards</li>
                  <li className="flex items-center gap-2 text-xs text-white/80"><Users className="h-4 w-4" /> UPI-APT bridging</li>
                </ul>
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground rounded-lg mt-2"
                  onClick={() => window.location.href = '/user'}
                >
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
