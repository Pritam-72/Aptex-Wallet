import React, { useState, useEffect } from 'react';
import { GridPatternCard, GridPatternCardBody } from '@/components/ui/card-with-grid-ellipsis-pattern';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { 
  Shield, 
  Zap, 
  Building2, 
  Users, 
  CreditCard,
  Globe,
  Lock,
  TrendingUp,
  Smartphone
} from 'lucide-react';

const FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [carouselApi, setCarouselApi] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Move features array to the top so it's available to all hooks
  const features = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Non-custodial wallets with military-grade encryption and private key protection",
      delay: "delay-200"
    },
    {
      icon: Zap,
      title: "Instant Transactions",
      description: "Lightning-fast Ethereum payments with real-time confirmation and settlement",
      delay: "delay-300"
    },
    {
      icon: CreditCard,
      title: "Zero Fees",
      description: "No third-party fees, no monthly charges, only network gas fees apply",
      delay: "delay-400"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Accept payments from anywhere in the world, 24/7 availability",
      delay: "delay-500"
    },
    {
      icon: Lock,
      title: "Self-Custody",
      description: "You control your private keys, we never have access to your funds",
      delay: "delay-600"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Comprehensive dashboard with transaction history and performance metrics",
      delay: "delay-700"
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Optimized for mobile devices with QR code scanning and NFC support",
      delay: "delay-800"
    },
    {
      icon: Building2,
      title: "Business Ready",
      description: "Enterprise-grade tools for merchants of all sizes with API access",
      delay: "delay-900"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('features-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      setSelectedIndex(carouselApi.selectedScrollSnap());
    };
    carouselApi.on('select', onSelect);
    setSelectedIndex(carouselApi.selectedScrollSnap());
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  // Auto-scroll effect for mobile carousel
  useEffect(() => {
    if (!carouselApi) return;
    const interval = setInterval(() => {
      const nextIdx = (carouselApi.selectedScrollSnap() + 1) % features.length;
      carouselApi.scrollTo(nextIdx);
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselApi, features.length]);

  return (
    <section 
      id="features-section"
      className="relative w-full py-20 md:py-32 px-6 md:px-12 bg-background overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-muted text-white">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
              Advanced Features
              <Zap className="h-2.5 w-2.5 text-primary" />
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-foreground mb-6">
            Built for the Future of
            <span className="text-primary block">Digital Payments</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            Every feature designed with security, simplicity, and scalability in mind. 
            Experience the next generation of financial technology.
          </p>
        </div>
        {/* Features Carousel (Mobile Only) */}
        <div className="block md:hidden relative px-8">
          <Carousel className="w-full" setApi={setCarouselApi}>
            <CarouselContent>
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <CarouselItem key={index}>
                    <GridPatternCard
                      className={`cosmic-glow relative hover:shadow-lg transition-all duration-500 group w-full h-56 sm:h-64 ${
                        isVisible ? `opacity-100 translate-y-0 ${feature.delay}` : 'opacity-0 translate-y-10'
                      }`}
                    >
                      <GridPatternCardBody className="space-y-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </GridPatternCardBody>
                    </GridPatternCard>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="-left-5 top-1/2 -translate-y-1/2" />
            <CarouselNext className="-right-5 top-1/2 -translate-y-1/2" />
          </Carousel>
          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-4">
            {features.map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  selectedIndex === idx
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                }`}
                onClick={() => carouselApi && carouselApi.scrollTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>
        {/* Features Grid (Desktop/Tablet Only) */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <GridPatternCard
                key={index}
                className={`cosmic-glow relative hover:shadow-lg transition-all duration-500 group w-full h-56 sm:h-64 ${
                  isVisible ? `opacity-100 translate-y-0 ${feature.delay}` : 'opacity-0 translate-y-10'
                }`}
              >
                <GridPatternCardBody className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </GridPatternCardBody>
              </GridPatternCard>
            );
          })}
        </div>
        {/* Bottom CTA */}
        <div className={`text-center mt-16 transition-all duration-700 delay-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-sm text-muted-foreground">
            Ready to revolutionize your payment experience? • Join thousands of satisfied users • Get started in minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
