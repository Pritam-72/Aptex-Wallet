import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, Users, Shield, Zap, Home } from 'lucide-react';
import { PinContainer } from '@/components/ui/3d-pin';
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

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AuthTypePage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleGoogleAuth = (accountType: string) => {
    // Handle Google authentication logic here
    console.log('Google Auth for:', accountType);
    // Navigate to appropriate dashboard after Google auth
    if (accountType === 'individual') {
      navigate('/user-dashboard');
    } else {
      navigate('/merchant-dashboard');
    }
  };

  return (
    <section className="relative w-full min-h-screen py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Home Icon - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="p-3 rounded-full bg-black/20 border border-gray-700 text-white hover:bg-gray-900/50 transition-all duration-300 hover:scale-105"
          aria-label="Go to Home"
        >
          <Home className="h-5 w-5" />
        </button>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 cosmic-grid opacity-20 sm:opacity-30"></div>
      
      {/* Gradient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] rounded-full">
        <div className="w-full h-full opacity-5 sm:opacity-8 md:opacity-10 bg-primary blur-[60px] sm:blur-[90px] md:blur-[120px]"></div>
      </div>
      
      {/* Auth Type Content */}
      <div className={`relative z-10 max-w-5xl text-center space-y-8 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Status Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-muted text-white">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="hidden sm:inline">Choose Your Account Type</span>
            <span className="sm:hidden">Account Type</span>
            <Shield className="h-2.5 w-2.5 text-primary" />
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-foreground leading-none">
          <span className="text-primary">Welcome to</span>
          <span className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl block mt-1 sm:mt-2">
            <span className="block sm:inline">CrypPal Solutions</span>
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto text-balance leading-relaxed px-2 sm:px-0">
          Choose how you want to use CrypPal. Whether you're an individual looking to spend crypto or a merchant ready to accept digital payments.
        </p>
      </div>

      {/* Account Type Cards */}
      <div className={`w-full max-w-7xl mt-12 sm:mt-16 md:mt-20 z-10 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 justify-center items-center px-2 sm:px-4">
          {isDesktop ? (
            <>
              {/* Individual Account Card (3D) */}
              <PinContainer title="Individual Account" href="/auth?type=individual">
                <div className="flex flex-col p-6 sm:p-8 tracking-tight text-slate-100/50 w-full max-w-[22rem] sm:w-[24rem] h-auto min-h-[24rem] sm:h-[26rem] bg-gradient-to-b from-slate-800/50 to-slate-800/0 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
                  {/* Header */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-slate-700/40 flex items-center justify-center">
                      <Users className="h-6 w-6 sm:h-7 sm:w-7 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">Individual</h3>
                      <p className="text-sm text-slate-400">Personal crypto spending</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-200">Direct</div>
                      <div className="text-xs text-slate-400 leading-relaxed">Crypto Payments</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-200">Secure</div>
                      <div className="text-xs text-slate-400 leading-relaxed">Portfolio Tracking</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 sm:space-y-4 flex-1">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">Direct crypto payments</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">Portfolio tracking</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">Transaction history</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-green-500 animate-pulse" />
                      <div className="text-xs text-slate-400">Ready to Start</div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4 py-2 transition-all duration-200 min-h-[36px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/auth?type=individual');
                      }}
                    >
                      Get Started
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </PinContainer>

              {/* Merchant Account Card (3D) */}
              <PinContainer title="Merchant Account" href="/auth?type=merchant">
                <div className="flex flex-col p-6 sm:p-8 tracking-tight text-slate-100/50 w-full max-w-[22rem] sm:w-[24rem] h-auto min-h-[24rem] sm:h-[26rem] bg-gradient-to-b from-slate-800/50 to-slate-800/0 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
                  {/* Header */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-slate-700/40 flex items-center justify-center">
                      <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">Merchant</h3>
                      <p className="text-sm text-slate-400">Accept crypto payments</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-200">0%</div>
                      <div className="text-xs text-slate-400 leading-relaxed">Third-party fees</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-200">Instant</div>
                      <div className="text-xs text-slate-400 leading-relaxed">ETH Payments</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 sm:space-y-4 flex-1">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">Accept crypto payments</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">Payment analytics</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">QR code generation</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-green-500 animate-pulse" />
                      <div className="text-xs text-slate-400">Ready to Accept</div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4 py-2 transition-all duration-200 min-h-[36px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/auth?type=merchant');
                      }}
                    >
                      Start Now
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </PinContainer>
            </>
          ) : (
            <>
              {/* Minimal Individual Card */}
              <div className="w-full max-w-xs bg-background border border-border rounded-xl p-5 flex flex-col items-start gap-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Individual</h3>
                    <p className="text-xs text-muted-foreground">Personal crypto spending</p>
                  </div>
                </div>
                <div className="text-sm text-foreground font-medium">Direct crypto payments, portfolio tracking, secure transactions.</div>
                {/* Feature List */}
                <ul className="mt-2 space-y-2 w-full">
                  <li className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="h-4 w-4" /> Direct crypto payments</li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground"><Zap className="h-4 w-4" /> Portfolio tracking</li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-4 w-4" /> Transaction history</li>
                </ul>
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground rounded-lg mt-2"
                  onClick={() => navigate('/auth?type=individual')}
                >
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {/* Minimal Merchant Card */}
              <div className="w-full max-w-xs bg-background border border-border rounded-xl p-5 flex flex-col items-start gap-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Merchant</h3>
                    <p className="text-xs text-muted-foreground">Accept crypto payments</p>
                  </div>
                </div>
                <div className="text-sm text-foreground font-medium">0% fees, instant ETH payments, QR code generation.</div>
                {/* Feature List */}
                <ul className="mt-2 space-y-2 w-full">
                  <li className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="h-4 w-4" /> Accept crypto payments</li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground"><Zap className="h-4 w-4" /> Payment analytics</li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-4 w-4" /> QR code generation</li>
                </ul>
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground rounded-lg mt-2"
                  onClick={() => navigate('/auth?type=merchant')}
                >
                  Start Now <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuthTypePage;
