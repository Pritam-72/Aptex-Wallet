import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GridPatternCard, GridPatternCardBody } from '@/components/ui/card-with-grid-ellipsis-pattern';
import { 
  ArrowRight, 
  Building2, 
  Users, 
  Zap, 
  Shield, 
  Wallet, 
  Target,
  Heart,
  Code,
  Globe,
  CreditCard,
  TrendingUp,
  Lightbulb,
  Rocket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';

const AboutPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Users Served', value: '10K+', icon: Users },
    { label: 'Transactions', value: '1M+', icon: Zap },
    { label: 'Countries', value: '15+', icon: Globe },
    { label: 'Uptime', value: '99.9%', icon: Shield }
  ];

  const teamValues = [
    {
      icon: Lightbulb,
      title: 'Innovation First',
      description: 'We build cutting-edge solutions that bridge traditional finance with blockchain technology.'
    },
    {
      icon: Shield,
      title: 'Security & Trust',
      description: 'Your assets and data are protected with enterprise-grade security and smart contract audits.'
    },
    {
      icon: Heart,
      title: 'User-Centric',
      description: 'Every feature is designed with user experience in mind, making DeFi accessible to everyone.'
    },
    {
      icon: Globe,
      title: 'Global Impact',
      description: 'Enabling financial inclusion across borders with seamless cross-border payment solutions.'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative w-full pt-32 pb-16 px-4 sm:px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden bg-background">
        {/* Background Effects */}
        <div className="absolute inset-0 cosmic-grid opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full">
          <div className="w-full h-full opacity-10 bg-primary blur-[120px]"></div>
        </div>

        <div className={`relative z-10 max-w-5xl text-center space-y-6 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-muted text-white">
              <Rocket className="h-3 w-3 text-primary" />
              About Our Mission
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-foreground leading-none">
            <span className="text-primary">Revolutionizing</span>
            <span className="text-3xl md:text-5xl lg:text-6xl block mt-2">
              Digital Payments
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed">
            We're building the future of money - where traditional finance meets blockchain innovation. 
            Our smart wallet bridges the gap between crypto and everyday payments, making DeFi accessible to everyone.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 items-center">
            {user ? (
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-medium h-11 px-7"
                onClick={() => navigate('/dashboard')}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-medium h-11 px-7"
                  onClick={() => navigate('/auth')}
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 md:px-12 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                We believe that financial services should be accessible, transparent, and user-friendly. 
                Our mission is to democratize access to advanced financial tools by combining the best 
                of traditional finance with blockchain innovation.
              </p>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                By building on Aptos blockchain, we're creating a smart wallet that doesn't just store 
                your crypto - it becomes your gateway to a new financial ecosystem where you can earn, 
                spend, save, and invest with unprecedented flexibility.
              </p>
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8 text-primary" />
                <span className="text-white font-medium">Building the future of money, today</span>
              </div>
            </div>
            <div className="relative">
              <GridPatternCard className="h-64 bg-gradient-to-br from-primary/10 to-purple-500/10">
                <GridPatternCardBody className="flex items-center justify-center">
                  <div className="text-center">
                    <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Innovation Hub</h3>
                    <p className="text-gray-300">Where fintech meets blockchain</p>
                  </div>
                </GridPatternCardBody>
              </GridPatternCard>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 md:px-12 bg-black/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Values</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we build and every decision we make.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamValues.map((value, index) => (
              <GridPatternCard key={index} className="bg-gradient-to-br from-gray-900/50 to-black/50">
                <GridPatternCardBody className="p-6">
                  <div className="mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{value.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{value.description}</p>
                </GridPatternCardBody>
              </GridPatternCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 md:px-12 bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Join the Revolution?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience the future of digital payments with our smart wallet. 
            Built on Aptos blockchain for security, speed, and scalability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Button 
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
                onClick={() => navigate('/dashboard')}
              >
                <Wallet className="h-5 w-5 mr-2" />
                Go to Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-black border-gray-700 text-white hover:bg-gray-900 rounded-full px-8"
                  onClick={() => navigate('/market')}
                >
                  View Markets
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutPage;